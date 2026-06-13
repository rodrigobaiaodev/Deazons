/**
 * run-articles.js  — v3 (estável, anti-rate-limit)
 * 
 * Busca feeds RSS ativos do Supabase, reescreve com Groq (llama-3.3-70b),
 * injeta imagens do TMDB e salva no Supabase como artigos publicados.
 *
 * Uso: node run-articles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── .env.local ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const i = line.indexOf('=');
    if (i < 1) return;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  });
  console.log('✅ .env.local carregado');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GROQ_KEY     = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const TMDB_KEY     = process.env.VITE_TMDB_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !GROQ_KEY) {
  console.error('❌ Faltam variáveis: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY');
  process.exit(1);
}

const MAX_PER_RUN   = 10;
const DELAY_MS      = 8000;  // 8s entre artigos — respeita rate limit
const BASE_DELAY_MS = 20000; // 20s de espera após rate limit

// ── RSS Parser simples ────────────────────────────────────────────────────────
function parseRss(xml) {
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      const x = block.match(r);
      return x ? x[1].trim() : '';
    };
    const getAttr = (tag, attr) => {
      const r = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
      const x = block.match(r);
      return x ? x[1] : '';
    };
    const title = get('title');
    const link  = get('link');
    if (!title || !link) continue;
    const content = get('content:encoded') || get('description') || '';
    let img = getAttr('media:content', 'url') || getAttr('enclosure', 'url');
    if (!img) { const x = content.match(/<img[^>]+src=["']([^"']+)["']/i); if (x) img = x[1]; }
    items.push({ title, link, content, img });
  }
  return items;
}

// ── Slug ──────────────────────────────────────────────────────────────────────
function slugify(t) {
  return (t || '')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 85);
}

// ── HTML entities ─────────────────────────────────────────────────────────────
function decodeHtml(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

// ── TMDB ──────────────────────────────────────────────────────────────────────
async function getTMDB(title) {
  if (!TMDB_KEY) return null;
  try {
    const q = title.replace(/review|crítica|trailer|teaser|\d+\s*(série|film)/gi, '').split(':')[0].trim();
    if (q.length < 3) return null;
    const r = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(q)}&page=1`);
    const d = await r.json();
    const res = (d.results || []).filter(x => x.media_type === 'movie' || x.media_type === 'tv');
    if (!res.length) return null;
    const f = res[0];
    return {
      main: f.backdrop_path  ? `https://image.tmdb.org/t/p/w1280${f.backdrop_path}` : f.poster_path ? `https://image.tmdb.org/t/p/w780${f.poster_path}` : null,
      poster: f.poster_path  ? `https://image.tmdb.org/t/p/w780${f.poster_path}` : null,
    };
  } catch { return null; }
}

// ── Supabase ──────────────────────────────────────────────────────────────────
const SB_HEADERS = { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'return=minimal' };

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  return r.ok ? r.json() : [];
}
async function sbPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'POST', headers: SB_HEADERS, body: JSON.stringify(body) });
  if (!r.ok) console.error('  SB error:', (await r.text()).slice(0, 120));
  return r.ok;
}
async function sbPatch(path, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'PATCH', headers: SB_HEADERS, body: JSON.stringify(body) });
}

// ── Groq ──────────────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    });

    if (r.ok) {
      const d = await r.json();
      return d?.choices?.[0]?.message?.content || '';
    }

    const err = await r.text();
    if (r.status === 429) {
      const secs = (err.match(/try again in ([\d.]+)s/) || [])[1];
      const wait = Math.ceil(parseFloat(secs || '30')) + 10;
      console.log(`  ⏳ Rate limit — aguardando ${wait}s... (tentativa ${attempt}/3)`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`Groq ${r.status}: ${err.slice(0, 150)}`);
  }
  throw new Error('Groq: rate limit persistente após 3 tentativas');
}

// ── Parse JSON da resposta do Groq ────────────────────────────────────────────
function parseJSON(text) {
  // Tenta extrair JSON mesmo que haja texto antes/depois ou markdown
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  
  // Tentativa 1: parse direto
  try { return JSON.parse(clean); } catch (_) {}
  
  // Tentativa 2: acha o primeiro { e o último } balanceado
  let start = clean.indexOf('{');
  if (start === -1) return null;
  
  let depth = 0, end = -1;
  for (let i = start; i < clean.length; i++) {
    if (clean[i] === '{') depth++;
    else if (clean[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  
  if (end === -1) return null;
  try { return JSON.parse(clean.slice(start, end + 1)); } catch (_) { return null; }
}

// ── Prompt compacto (menos tokens = menos rate limit) ────────────────────────
function buildPrompt(title, rawContent) {
  // Limita o conteúdo do feed a 2000 chars para economizar tokens
  const content = rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);

  return `Você é redator do portal brasileiro "Deazons" (cinema, séries, cultura pop).
Reescreva este artigo em PT-BR. Retorne APENAS JSON puro sem markdown.

REGRAS:
- Mínimo 1200 palavras no campo "content"
- 5 subtítulos <h2>
- 1 <blockquote> com citação impactante
- 1 <ul> com 4-5 bullet points de curiosidades
- NÃO use tags <img> no content
- NÃO mencione a fonte original
- Tom jornalístico e envolvente

JSON de retorno (sem \`\`\`):
{"title":"título chamativo","slug":"slug-kebab","meta_description":"150-160 chars SEO","tags":["t1","t2","t3"],"category":"Cinema|Séries|Marvel|DC|Streaming|Anime|Cultura Pop","content":"<p>intro</p><h2>...</h2>..."}

NOTÍCIA:
Título: ${title}
Conteúdo: ${content}`;
}

// ── Injeta imagens no HTML ────────────────────────────────────────────────────
function injectImages(html, mainImg, posterImg, alt) {
  // Remove imgs existentes
  let c = html.replace(/<img[^>]*>/gi, '').replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '').trim();

  // Capa no topo
  const cover = `<figure style="margin:0 0 2rem">
  <img src="${mainImg}" alt="${alt}" style="width:100%;border-radius:12px" />
</figure>`;

  // Poster no meio (após 3º h2 se disponível)
  if (posterImg && posterImg !== mainImg) {
    let cnt = 0;
    c = c.replace(/<h2/gi, m => { cnt++; return cnt === 3 ? `<figure style="margin:2rem 0"><img src="${posterImg}" alt="${alt}" style="width:100%;border-radius:12px"/></figure>\n${m}` : m; });
  }

  return cover + '\n' + c;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function wordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Deazons — Geração de Artigos v3`);
  console.log(`   ${new Date().toLocaleString('pt-BR')} | Max: ${MAX_PER_RUN} artigos\n`);

  const sources = await sbGet('rss_sources?active=eq.true&select=*');
  console.log(`📡 Feeds ativos: ${sources.length}`);
  if (!sources.length) return console.log('Nenhum feed ativo.');

  let created = 0;

  outer:
  for (const src of sources) {
    console.log(`\n📰 ${src.name}`);
    let items;
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) { console.log(`  ❌ HTTP ${res.status}`); continue; }
      items = parseRss(await res.text());
      console.log(`  ↳ ${items.length} itens`);
      await sbPatch(`rss_sources?id=eq.${src.id}`, { last_fetched: new Date().toISOString() });
    } catch (e) { console.log(`  ❌ ${e.message}`); continue; }

    for (const item of items) {
      if (created >= MAX_PER_RUN) break outer;

      // Checa duplicata
      const exists = await sbGet(`articles?source_url=eq.${encodeURIComponent(item.link)}&select=id&limit=1`);
      if (exists.length) { process.stdout.write('.'); continue; }

      const title = decodeHtml(item.title);
      console.log(`\n  [${created + 1}/${MAX_PER_RUN}] ${title.slice(0, 65)}`);

      // Imagem
      const tmdb = await getTMDB(title);
      const mainImg   = tmdb?.main   || item.img || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
      const posterImg = tmdb?.poster || null;

      // Groq
      let data;
      try {
        console.log('  🤖 Gerando...');
        const raw = await callGroq(buildPrompt(title, item.content));
        data = parseJSON(raw);
        if (!data?.content) {
          console.log('  ❌ JSON inválido — pulando');
          console.log('  Preview:', raw.slice(0, 200));
          continue;
        }
      } catch (e) {
        console.log(`  ❌ ${e.message}`);
        continue;
      }

      const wc = wordCount(data.content);
      console.log(`  📝 ${wc} palavras`);

      const content = injectImages(data.content, mainImg, posterImg, data.title || title);
      const slug    = slugify(data.slug || data.title || title);

      const ok = await sbPost('articles', {
        title:            (data.title || title).slice(0, 200),
        slug,
        content,
        meta_description: (data.meta_description || '').slice(0, 160),
        status:           'published',
        published_at:     new Date().toISOString(),
        image_url:        mainImg,
        image_alt:        (data.title || title).slice(0, 200),
        tags:             data.tags || [],
        category:         data.category || 'Cinema',
        source_url:       item.link,
      });

      if (ok) {
        created++;
        console.log(`  ✅ Salvo: "${(data.title || title).slice(0, 60)}"`);
      }

      if (created < MAX_PER_RUN) {
        console.log(`  ⏳ ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);
      }
    }
  }

  console.log(`\n✨ ${created} artigos criados.\n`);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
