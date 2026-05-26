/**
 * api/cron-articles.js
 * Vercel Serverless Function acionada pelo Vercel Cron Jobs (vercel.json)
 *
 * Roda todos os dias às 08:00 BRT (11:00 UTC).
 * Busca feeds RSS, reescreve até 10 artigos por dia com Gemini,
 * salva no Supabase e atualiza o sitemap-articles.xml automaticamente.
 *
 * Variáveis de ambiente necessárias (já existentes):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_SERVICE_ROLE_KEY
 *   GROQ_API_KEY
 *   VITE_TMDB_API_KEY
 */

const parseRssXml = (xmlStr) => {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  const getTag = (xmlStr, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
    const m = xmlStr.match(regex);
    return m ? m[1].trim() : null;
  };

  const getAttribute = (xmlStr, tag, attr) => {
    const regex = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
    const m = xmlStr.match(regex);
    return m ? m[1] : null;
  };

  while ((match = itemRegex.exec(xmlStr)) !== null) {
    const itemXml = match[1];
    const title = getTag(itemXml, 'title');
    const link = getTag(itemXml, 'link');
    const description = getTag(itemXml, 'description');
    const content = getTag(itemXml, 'content:encoded');
    const pubDate = getTag(itemXml, 'pubDate');
    
    const categories = [];
    const categoryRegex = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category>([\s\S]*?)<\/category>/gi;
    let catMatch;
    while ((catMatch = categoryRegex.exec(itemXml)) !== null) {
      categories.push((catMatch[1] || catMatch[2]).trim());
    }
    
    let imageUrl = getAttribute(itemXml, 'media:content', 'url') || getAttribute(itemXml, 'enclosure', 'url');
    if (!imageUrl && content) {
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    if (!imageUrl && description) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    
    if (title && link) {
      items.push({
        title,
        link,
        description: content || description || '', 
        content: content || description || '',
        pubDate,
        thumbnail: imageUrl,
        enclosure: imageUrl ? { link: imageUrl } : null,
        categories
      });
    }
  }
  return items;
};
const MAX_ARTICLES_PER_RUN = 10;
const DELAY_BETWEEN_ARTICLES_MS = 3000; // 3s para rate limit do Groq

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 90);
}

function extractImage(item) {
  if (item.enclosure?.link) return item.enclosure.link;
  if (item.thumbnail) return item.thumbnail;
  const content = item.content || item.description || '';
  const m = content.match(/<img[^>]+src="([^">]+)"/);
  return m ? m[1] : null;
}

async function getTMDBImage(title, tmdbKey) {
  try {
    const q = title.replace(/Review|Crítica|Trailer|Teaser|Confirmado|Rumor/gi, '').split(':')[0].trim();
    if (!q) return null;
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&language=pt-BR&query=${encodeURIComponent(q)}&page=1`
    );
    const data = await res.json();
    const results = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    if (!results.length) return null;
    const first = results[0];
    if (first.backdrop_path) return `https://image.tmdb.org/t/p/w1280${first.backdrop_path}`;
    if (first.poster_path)  return `https://image.tmdb.org/t/p/w780${first.poster_path}`;
    return null;
  } catch { return null; }
}

function parseAIResponse(text) {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(clean); } catch (_) {}
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    return null;
  } catch { return null; }
}

/** Remove TODAS as tags <img> do HTML para evitar imagens repetidas no corpo */
function stripImagesFromContent(html) {
  return html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildAIPrompt(title, rawContent, imageUrl) {
  return `Você é um redator sênior do portal de entretenimento "Deazons" (Brasil).
Reescreva o artigo abaixo em português brasileiro de forma 100% original, autoritativa e otimizada para SEO e AdSense.

REGRAS OBRIGATÓRIAS:
1. Mínimo de 900 palavras. Expanda com contexto histórico, curiosidades, impacto cultural e perspectivas.
2. Tom envolvente, opinativo e "nerd" profissional.
3. Exatamente 4 subtítulos <h2> com palavras-chave relevantes.
4. NÃO mencione o site de origem.
5. NÃO inclua nenhuma tag <img> no conteúdo — apenas texto e H2.
6. NÃO inclua o <h1> no campo "content" (ele é renderizado separadamente).
7. A imagem de capa será exibida automaticamente pelo sistema — não a coloque no conteúdo.

FORMATO DE RETORNO — responda APENAS com JSON válido (sem markdown, sem \`\`\`):
{
  "title": "Título reescrito e chamativo",
  "slug": "titulo-em-kebab-case",
  "meta_description": "Descrição entre 150-160 caracteres para SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Uma de: Cinema, Séries, Marvel, DC, Lançamentos, Cultura Pop, Streaming, Anime",
  "content": "<p>Introdução...</p><h2>Subtítulo 1</h2><p>Texto...</p><h2>Subtítulo 2</h2><p>Texto...</p><h2>Subtítulo 3</h2><p>Texto...</p><h2>Subtítulo 4</h2><p>Conclusão...</p>"
}

NOTÍCIA ORIGINAL:
Título: ${title}
Conteúdo: ${rawContent.substring(0, 3000)}`;
}

// ─── Supabase helpers (usando fetch direto — sem SDK no server) ───────────────

function supabaseHeaders(serviceKey) {
  return {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer': 'return=minimal'
  };
}

async function supabaseFetch(url, serviceKey, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...supabaseHeaders(serviceKey), ...(options.headers || {}) }
  });
  return res;
}

async function getActiveSources(supabaseUrl, serviceKey) {
  const res = await supabaseFetch(
    `${supabaseUrl}/rest/v1/rss_sources?active=eq.true&select=*`,
    serviceKey
  );
  return res.ok ? await res.json() : [];
}

async function articleExists(supabaseUrl, serviceKey, sourceUrl) {
  const res = await supabaseFetch(
    `${supabaseUrl}/rest/v1/articles?source_url=eq.${encodeURIComponent(sourceUrl)}&select=id&limit=1`,
    serviceKey
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data.length > 0;
}

async function insertArticle(supabaseUrl, serviceKey, article) {
  const res = await supabaseFetch(
    `${supabaseUrl}/rest/v1/articles`,
    serviceKey,
    { method: 'POST', body: JSON.stringify(article) }
  );
  return res.ok;
}

async function updateSourceFetched(supabaseUrl, serviceKey, id) {
  await supabaseFetch(
    `${supabaseUrl}/rest/v1/rss_sources?id=eq.${id}`,
    serviceKey,
    { method: 'PATCH', body: JSON.stringify({ last_fetched: new Date().toISOString() }) }
  );
}

async function getPublishedArticles(supabaseUrl, serviceKey) {
  const res = await supabaseFetch(
    `${supabaseUrl}/rest/v1/articles?status=eq.published&select=slug,published_at&order=published_at.desc`,
    serviceKey
  );
  return res.ok ? await res.json() : [];
}

// ─── Sitemap updater ─────────────────────────────────────────────────────────
// Atualiza o sitemap-articles.xml via Supabase Storage ou registra apenas no log.
// Como o sitemap está em /public, ele é servido de forma estática pelo Vercel.
// Para atualizar o sitemap em produção, a melhor abordagem é chamar
// a API do Supabase para obter todos os artigos e regenerar via edge function.
// Aqui, vamos apenas retornar a lista para ser processada externamente.

async function buildArticlesSitemapContent(articles) {
  const today = new Date().toISOString().split('T')[0];
  const urls = articles.map(a => {
    const lastmod = a.published_at ? a.published_at.split('T')[0] : today;
    return `  <url>
    <loc>https://deazons.com/noticias/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ─── Groq call ─────────────────────────────────────────────────────────────

async function callGroq(groqKey, prompt) {
  const url = `https://api.groq.com/openai/v1/chat/completions`;
  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 4096
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Segurança: só aceitar chamadas do próprio Vercel Cron ou com chave secreta
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET || '';
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const GROQ_KEY     = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const TMDB_KEY     = process.env.VITE_TMDB_API_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY || !GROQ_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const logs = [];
  const log = (msg) => { logs.push(msg); console.log(`[cron-articles] ${msg}`); };

  log(`🚀 Iniciando ciclo diário — ${new Date().toISOString()}`);

  try {
    const sources = await getActiveSources(SUPABASE_URL, SERVICE_KEY);
    log(`📡 Fontes ativas: ${sources.length}`);

    if (!sources.length) {
      return res.status(200).json({ ok: true, articlesCreated: 0, logs });
    }

    let articlesCreated = 0;
    let totalProcessed = 0;

    outerLoop:
    for (const source of sources) {
      log(`📰 Feed: ${source.name}`);

      let items = [];
      try {
        const feedRes = await fetch(source.url, { signal: AbortSignal.timeout(15000) });
        const xmlData = await feedRes.text();
        items = parseRssXml(xmlData);
        if (items.length === 0) {
            log(`  ❌ Nenhum item encontrado no feed`);
            continue;
        }
        await updateSourceFetched(SUPABASE_URL, SERVICE_KEY, source.id);
        log(`  ↳ ${items.length} itens no feed`);
      } catch (err) {
        log(`  ❌ Erro lendo feed: ${err.message}`);
        continue;
      }

      for (const item of items) {
        if (articlesCreated >= MAX_ARTICLES_PER_RUN) break outerLoop;
        if (!item.link || !item.title) continue;

        // Checar duplicata
        const exists = await articleExists(SUPABASE_URL, SERVICE_KEY, item.link);
        if (exists) continue;

        totalProcessed++;
        log(`  ✏️  Processando (${articlesCreated + 1}/${MAX_ARTICLES_PER_RUN}): ${item.title.substring(0, 50)}`);

        // Imagem: RSS primeiro, depois TMDB como fallback
        let imageUrl = extractImage(item);
        if (!imageUrl && TMDB_KEY) {
          imageUrl = await getTMDBImage(item.title, TMDB_KEY);
        }
        // Fallback final: imagem genérica de cinema
        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
        }

        const rawContent = item.content || item.description || '';
        const prompt = buildAIPrompt(item.title, rawContent, imageUrl);

        let articleData = null;
        try {
          const aiText = await callGroq(GROQ_KEY, prompt);
          articleData = parseAIResponse(aiText);
          if (!articleData) {
            log(`  ❌ Falha ao parsear resposta Groq`);
            continue;
          }
        } catch (err) {
          log(`  ❌ Erro Groq: ${err.message}`);
          // Aguarda mais tempo se for rate limit
          if (err.message.includes('429')) {
            log(`  ⏳ Rate limit — aguardando 30s...`);
            await new Promise(r => setTimeout(r, 30000));
          }
          continue;
        }

        // Limpar imagens do conteúdo (evita repetição)
        const cleanContent = stripImagesFromContent(articleData.content || '');
        const finalSlug = slugify(articleData.slug || articleData.title || item.title);

        const newArticle = {
          title: articleData.title || item.title,
          slug: finalSlug,
          content: cleanContent,
          meta_description: (articleData.meta_description || '').substring(0, 160),
          status: 'published',
          published_at: new Date().toISOString(),
          image_url: imageUrl,
          image_alt: articleData.title || item.title,
          tags: articleData.tags || [],
          category: articleData.category || 'Cinema',
          source_url: item.link,
        };

        const saved = await insertArticle(SUPABASE_URL, SERVICE_KEY, newArticle);
        if (saved) {
          articlesCreated++;
          log(`  ✅ Salvo: "${newArticle.title.substring(0, 50)}"`);
        } else {
          log(`  ❌ Erro ao salvar no Supabase`);
        }

        // Delay para respeitar rate limit Gemini (10 RPM free tier)
        if (articlesCreated < MAX_ARTICLES_PER_RUN) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_ARTICLES_MS));
        }
      }
    }

    // ── Atualizar sitemap-articles.xml via response header para deploy pipeline
    // (O sitemap estático é atualizado pelo script fix-sitemaps.cjs no build)
    // Aqui retornamos os artigos para auditoria.
    const allArticles = await getPublishedArticles(SUPABASE_URL, SERVICE_KEY);
    const sitemapContent = await buildArticlesSitemapContent(allArticles);

    log(`\n📊 Resumo: ${articlesCreated} artigos criados | ${allArticles.length} total publicados`);

    return res.status(200).json({
      ok: true,
      articlesCreated,
      totalPublished: allArticles.length,
      sitemapUrls: allArticles.length,
      logs,
      // Retorna o sitemap para ser salvo pelo pipeline se necessário
      sitemapXml: sitemapContent,
    });

  } catch (err) {
    log(`💥 Erro fatal: ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message, logs });
  }
}
