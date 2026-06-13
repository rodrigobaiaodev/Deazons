/**
 * run-articles.js
 * Script local para rodar a geração de artigos manualmente,
 * replicando a lógica do api/cron-articles.js com as vars do .env.local
 *
 * Uso: node run-articles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Carrega .env.local ──────────────────────────────────────────────────────
const loadEnv = () => {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx < 0) return;
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key) process.env[key] = val;
      });
      console.log('✅ .env.local carregado');
    }
  } catch (e) {
    console.error('Erro ao ler .env.local:', e.message);
  }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GROQ_KEY     = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const TMDB_KEY     = process.env.VITE_TMDB_API_KEY;
const MAX_ARTICLES_PER_RUN = 10;
const DELAY_BETWEEN_ARTICLES_MS = 4000;

if (!SUPABASE_URL || !SERVICE_KEY || !GROQ_KEY) {
  console.error('❌ Variáveis de ambiente faltando. Verifique .env.local');
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const parseRssXml = (xmlStr) => {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  const getTag = (xml, tag) => {
    const rx = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
    const m = xml.match(rx);
    return m ? m[1].trim() : null;
  };

  const getAttribute = (xml, tag, attr) => {
    const rx = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
    const m = xml.match(rx);
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
    const catRx = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category>([\s\S]*?)<\/category>/gi;
    let catMatch;
    while ((catMatch = catRx.exec(itemXml)) !== null) {
      categories.push((catMatch[1] || catMatch[2]).trim());
    }

    let imageUrl = getAttribute(itemXml, 'media:content', 'url') || getAttribute(itemXml, 'enclosure', 'url');
    if (!imageUrl && content) {
      const imgM = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgM) imageUrl = imgM[1];
    }
    if (!imageUrl && description) {
      const imgM = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgM) imageUrl = imgM[1];
    }

    if (title && link) {
      items.push({ title, link, description: content || description || '', content: content || description || '', pubDate, thumbnail: imageUrl, enclosure: imageUrl ? { link: imageUrl } : null, categories });
    }
  }
  return items;
};

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 90);
}

function extractImage(item) {
  if (item.enclosure?.link) return item.enclosure.link;
  if (item.thumbnail) return item.thumbnail;
  const content = item.content || item.description || '';
  const m = content.match(/<img[^>]+src="([^">]+)"/);
  return m ? m[1] : null;
}

async function getTMDBImage(title) {
  try {
    const q = title.replace(/Review|Crítica|Trailer|Teaser|Confirmado|Rumor/gi, '').split(':')[0].trim();
    if (!q) return null;
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(q)}&page=1`);
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

function stripImagesFromContent(html) {
  return html.replace(/<img[^>]*>/gi, '').replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '').replace(/\n{3,}/g, '\n\n').trim();
}

function buildAIPrompt(title, rawContent) {
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

// ── Supabase helpers ─────────────────────────────────────────────────────────

function sbHeaders() {
  return { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'return=minimal' };
}

async function sbFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { ...sbHeaders(), ...(opts.headers || {}) } });
}

async function getActiveSources() {
  const res = await sbFetch(`${SUPABASE_URL}/rest/v1/rss_sources?active=eq.true&select=*`);
  return res.ok ? await res.json() : [];
}

async function articleExists(sourceUrl) {
  const res = await sbFetch(`${SUPABASE_URL}/rest/v1/articles?source_url=eq.${encodeURIComponent(sourceUrl)}&select=id&limit=1`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.length > 0;
}

async function insertArticle(article) {
  const res = await sbFetch(`${SUPABASE_URL}/rest/v1/articles`, { method: 'POST', body: JSON.stringify(article) });
  if (!res.ok) {
    const err = await res.text();
    console.error('  Supabase error:', err);
  }
  return res.ok;
}

async function updateSourceFetched(id) {
  await sbFetch(`${SUPABASE_URL}/rest/v1/rss_sources?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ last_fetched: new Date().toISOString() }) });
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.75, max_tokens: 4096 })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Iniciando geração de artigos — ${new Date().toLocaleString('pt-BR')}`);
  console.log(`   Máximo por rodada: ${MAX_ARTICLES_PER_RUN} artigos\n`);

  const sources = await getActiveSources();
  console.log(`📡 Fontes ativas: ${sources.length}`);
  if (!sources.length) { console.log('Nenhuma fonte ativa. Encerrando.'); return; }

  let articlesCreated = 0;

  outerLoop:
  for (const source of sources) {
    console.log(`\n📰 Feed: ${source.name} (${source.url})`);

    let items = [];
    try {
      const feedRes = await fetch(source.url, { signal: AbortSignal.timeout(15000) });
      if (!feedRes.ok) { console.log(`  ❌ HTTP ${feedRes.status}`); continue; }
      const xmlData = await feedRes.text();
      items = parseRssXml(xmlData);
      if (!items.length) { console.log('  ❌ Nenhum item no feed'); continue; }
      await updateSourceFetched(source.id);
      console.log(`  ↳ ${items.length} itens encontrados`);
    } catch (err) {
      console.log(`  ❌ Erro lendo feed: ${err.message}`);
      continue;
    }

    for (const item of items) {
      if (articlesCreated >= MAX_ARTICLES_PER_RUN) break outerLoop;
      if (!item.link || !item.title) continue;

      const exists = await articleExists(item.link);
      if (exists) { process.stdout.write('.'); continue; }

      console.log(`\n  ✏️  [${articlesCreated + 1}/${MAX_ARTICLES_PER_RUN}] ${item.title.substring(0, 60)}`);

      // Imagem
      let imageUrl = null;
      if (TMDB_KEY) imageUrl = await getTMDBImage(item.title);
      if (!imageUrl) imageUrl = extractImage(item);
      if (!imageUrl) imageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';

      const prompt = buildAIPrompt(item.title, item.content || item.description || '');

      let articleData = null;
      try {
        const aiText = await callGroq(prompt);
        articleData = parseAIResponse(aiText);
        if (!articleData) { console.log('  ❌ Falha ao parsear resposta Groq'); continue; }
      } catch (err) {
        console.log(`  ❌ Erro Groq: ${err.message}`);
        if (err.message.includes('429')) {
          console.log('  ⏳ Rate limit — aguardando 30s...');
          await new Promise(r => setTimeout(r, 30000));
        }
        continue;
      }

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

      const saved = await insertArticle(newArticle);
      if (saved) {
        articlesCreated++;
        console.log(`  ✅ Salvo: "${newArticle.title.substring(0, 60)}"`);
      } else {
        console.log('  ❌ Erro ao salvar no Supabase');
      }

      if (articlesCreated < MAX_ARTICLES_PER_RUN) {
        console.log(`  ⏳ Aguardando ${DELAY_BETWEEN_ARTICLES_MS / 1000}s (rate limit)...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_ARTICLES_MS));
      }
    }
  }

  console.log(`\n✨ Concluído! ${articlesCreated} artigos criados nesta rodada.\n`);
}

main().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
