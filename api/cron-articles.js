/**
 * api/cron-articles.js
 * Vercel Serverless Function acionada pelo Vercel Cron Jobs (vercel.json)
 *
 * Executa 5x por dia (a cada ~4h): 07h, 11h, 15h, 19h, 23h BRT.
 * Publica 1 artigo por execução → máximo de 5 artigos/dia.
 * Artigos parafraseados do RSS com linkagem interna (política AdSense).
 *
 * Variáveis de ambiente necessárias:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_SERVICE_ROLE_KEY
 *   GROQ_API_KEY
 *   VITE_TMDB_API_KEY
 *   CRON_SECRET
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
const MAX_ARTICLES_PER_RUN = 1;       // 1 artigo por execução — cron roda 5x/dia
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

// Links internos do site para usar no conteúdo (AdSense-friendly)
const INTERNAL_LINKS = [
  { href: '/noticias',       label: 'mais notícias de cinema e séries' },
  { href: '/filmes',         label: 'filmes em destaque' },
  { href: '/series',         label: 'séries imperdíveis' },
  { href: '/blog',           label: 'nosso blog de cultura pop' },
  { href: '/noticias',       label: 'últimas notícias do mundo do entretenimento' },
];

function pickInternalLinks() {
  // Seleciona 2 links internos aleatórios distintos
  const shuffled = [...INTERNAL_LINKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

function buildPrompt(title, rawContent) {
  // Preserva o HTML original completo (com imagens, estrutura)
  const originalHtml = rawContent.trim().slice(0, 15000);
  const [link1, link2] = pickInternalLinks();

  return `Você é um editor do portal brasileiro "Deazons" (especializado em cultura pop, cinema e séries).
Sua tarefa é parafrasear o artigo HTML abaixo.

REGRAS ABSOLUTAS — siga TODAS rigorosamente:
1. GERE HTML LIMPO E SEMÂNTICO: Use apenas tags limpas (<p>, <h2>, <h3>, <ul>, <li>, <blockquote>). OBRIGATÓRIO: Remova TODOS os atributos "class", "id" e "style" de todas as tags HTML. Não use "text-align" ou formatações inline.
2. IMAGENS: Mantenha as tags <img> originais, preservando APENAS os atributos "src" e "alt". Remova width, height, class e style das imagens. Opcionalmente, envolva as imagens em uma tag <figure> simples.
3. REMOVA todos os links externos (<a href> apontando para outros domínios) — substitua pelo texto âncora simples.
4. ADICIONE exatamente 2 links internos naturais no corpo do texto, nas posições onde façam sentido contextual:
   - Link A: <a href="${link1.href}">${link1.label}</a>
   - Link B: <a href="${link2.href}">${link2.label}</a>
5. APENAS substitua o TEXTO VISÍVEL por sinônimos naturais. Não invente fatos novos.
6. ESTRUTURA IDEAL DE LEITURA: Divida o texto em parágrafos curtos (2 a 4 frases no máximo por parágrafo) usando a tag <p>. Distribua bem o conteúdo para não formar "paredes de texto". Use <h2> ou <h3> para subtítulos onde fizer sentido.
7. O título pode ser levemente reescrito para ficar mais chamativo, mas deve manter o mesmo sentido.
8. NUNCA retorne um bloco gigante de texto. O texto deve ser altamente escaneável e agradável de ler em telas de celular.
9. NÃO inclua o <h1> no campo "content" (ele é renderizado separadamente no site).

FORMATO DE RETORNO — responda APENAS com JSON válido (sem markdown, sem \`\`\`):
{
  "title": "Título parafraseado e levemente mais chamativo",
  "slug": "titulo-em-kebab-case-sem-acentos",
  "meta_description": "Descrição de 150-160 caracteres baseada no artigo original.",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Uma de: Cinema, Séries, Marvel, DC, Lançamentos, Cultura Pop, Streaming, Anime",
  "content": "<p>HTML parafraseado com links internos inseridos...</p>"
}

ARTIGO ORIGINAL PARA PARAFRASEAR:
Título: ${title}
Conteúdo HTML: ${originalHtml}`;
}

// === Fetch Full Content ========================================================
async function fetchFullContent(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    let clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '');

    let mainMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (!mainMatch) mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) clean = mainMatch[1];
    else {
      const bodyMatch = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) clean = bodyMatch[1];
    }

    clean = clean.replace(/<\/?div[^>]*>/gi, '\n');
    clean = clean.replace(/<\/?span[^>]*>/gi, '');
    clean = clean.replace(/<\/?button[^>]*>/gi, '');
    clean = clean.replace(/\n\s*\n/g, '\n\n').trim();

    const textLen = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
    if (textLen > 400) {
      console.log(`    ↳ Conteúdo extraído da URL (${textLen} chars)`);
      return clean;
    }
    return null;
  } catch (e) {
    console.log(`    ↳ Não foi possível buscar URL: ${e.message.slice(0, 60)}`);
    return null;
  }
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

        if (/[\u0400-\u04FF\u4E00-\u9FFF\uAC00-\uD7AF\u0600-\u06FF\u1E00-\u1EFF]/.test(item.title)) {
          log(`  ⏭️  Ignorado (idioma não suportado): ${item.title.substring(0, 50)}`);
          continue;
        }

        const rawText = (item.content || item.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const TOPIC_KEYWORDS = /film|movie|série|series|cinema|stream|netflix|disney|hbo|amazon|prime|apple tv|episód|temporada|ator|atriz|diretor|trailer|estreia|lançamento|marvel|dc |anime|bilheteria|oscar|emmy|golden globe|review|crítica|tv show|television/i;
        if (!TOPIC_KEYWORDS.test(item.title) && !TOPIC_KEYWORDS.test(rawText.slice(0, 500))) {
          log(`  ⏭️  Ignorado (fora do tema): ${item.title.substring(0, 50)}`);
          continue;
        }

        if (rawText.length < 300) {
          log(`  ⏭️  Ignorado (conteúdo muito curto: ${rawText.length} chars): ${item.title.substring(0, 50)}`);
          continue;
        }

        const exists = await articleExists(SUPABASE_URL, SERVICE_KEY, item.link);
        if (exists) continue;

        log(`  ✏️  Processando (${articlesCreated + 1}/${MAX_ARTICLES_PER_RUN}): ${item.title.substring(0, 50)}`);

        let finalContent = item.content || item.description || '';
        if (rawText.length < 1500) {
          log(`  🔍 RSS curto (${rawText.length} chars) — buscando URL...`);
          const fullHtml = await fetchFullContent(item.link);
          if (fullHtml) finalContent = fullHtml;
        }

        const finalText = finalContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (finalText.length < 300) {
          log(`  ⏭️  Ignorado (mesmo após fetch, insuficiente: ${finalText.length} chars)`);
          continue;
        }
        log(`  📄 Conteúdo total disponível para paráfrase: ${finalText.length} chars`);

        let imageUrl = null;
        if (TMDB_KEY) {
          imageUrl = await getTMDBImage(item.title, TMDB_KEY);
        }
        if (!imageUrl) {
          imageUrl = extractImage(item);
        }
        // Fallback final: imagem genérica de cinema
        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
        }

        const prompt = buildPrompt(item.title, finalContent);

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

        // Preserva o HTML original (imagens, links) — apenas substitui sinônimos
        // Injeta imagem de capa (TMDB) apenas se não estiver já no conteúdo
        let finalContent = articleData.content || '';
        if (imageUrl && !finalContent.includes(imageUrl)) {
          const cover = `<figure style="margin: 0 0 2.5rem 0;"><img src="${imageUrl}" alt="${articleData.title || item.title}" style="width:100%; border-radius:16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" /></figure>`;
          const firstP = finalContent.indexOf('</p>');
          if (firstP !== -1) {
            finalContent = finalContent.substring(0, firstP + 4) + '\n' + cover + '\n' + finalContent.substring(firstP + 4);
          } else {
            finalContent = cover + '\n' + finalContent;
          }
        }
        const finalSlug = slugify(articleData.slug || articleData.title || item.title);

        const newArticle = {
          title: articleData.title || item.title,
          slug: finalSlug,
          content: finalContent,
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
