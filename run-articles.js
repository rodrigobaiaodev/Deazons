/**
 * run-articles.js  — v5 (Paráfrase com Linkagem Interna, AdSense Ready)
 * 
 * Busca feeds RSS ativos do Supabase, parafraseia com Groq (llama-3.3-70b)
 * preservando estrutura HTML original (imagens, links internos), sem links externos.
 * Publica 1 artigo por execução (5 artigos/dia via cron).
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
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GROQ_KEY     = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const TMDB_KEY     = process.env.VITE_TMDB_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !GROQ_KEY) {
  console.error('❌ Faltam variáveis: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY');
  process.exit(1);
}

const MAX_PER_RUN   = process.env.MAX_PER_RUN ? parseInt(process.env.MAX_PER_RUN, 10) : 1;
const DELAY_MS      = 5000; 

// ── RSS Parser ────────────────────────────────────────────────────────────────
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
    
    const extraImages = [];
    const allImgsRx = /<img[^>]+src=["']([^"']+)["']/gi;
    let imgM;
    while ((imgM = allImgsRx.exec(content)) !== null) {
      if (!imgM[1].includes('youtube') && !imgM[1].includes('iframe') && !imgM[1].includes('embed')) {
        extraImages.push(imgM[1]);
      }
    }
    const uniqueImages = [...new Set(extraImages)];
    
    // Ignorar iframes ou vídeos (YouTube etc)
    if (img && (img.includes('youtube') || img.includes('embed') || img.includes('iframe'))) {
      img = null;
    }
    
    items.push({ title, link, content, img, extraImages: uniqueImages });
  }
  return items;
}

// ── Utils ──────────────────────────────────────────────────────────────────────
function slugify(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 85);
}

function decodeHtml(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
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

// ── Fetch Full Article Content ────────────────────────────────────────────────
// Quando o RSS entrega apenas um resumo curto, busca o HTML completo da URL de origem
// e extrai o conteúdo principal do artigo (sem nav, ads, footer, scripts).
async function fetchFullContent(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Remove blocos irrelevantes (scripts, styles, nav, aside, footer, ads)
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

    // Extrai article ou main se houver
    let mainMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (!mainMatch) mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) clean = mainMatch[1];
    else {
      const bodyMatch = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) clean = bodyMatch[1];
    }

    // Remove tags de layout (div, span, button) preservando o conteúdo interno
    clean = clean.replace(/<\/?div[^>]*>/gi, '\n');
    clean = clean.replace(/<\/?span[^>]*>/gi, '');
    clean = clean.replace(/<\/?button[^>]*>/gi, '');
    clean = clean.replace(/\n\s*\n/g, '\n\n').trim();

    const textLen = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
    if (textLen > 400) {
      console.log(`    ↳ Conteúdo completo extraído da URL (${textLen} chars de texto úteis)`);
      return clean;
    }
    return null;
  } catch (e) {
    console.log(`    ↳ Não foi possível buscar URL completa: ${e.message.slice(0, 60)}`);
    return null;
  }
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
  for (let attempt = 1; attempt <= 5; attempt++) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      }),
    });

    if (r.ok) {
      const d = await r.json();
      return d?.choices?.[0]?.message?.content || '';
    }

    const err = await r.text();
    if (r.status === 429) {
      const secs = (err.match(/try again in ([\d.]+)s/) || [])[1];
      const wait = Math.ceil(parseFloat(secs || '60')) + 10;
      console.log(`  ⏳ Rate limit — aguardando ${wait}s... (tentativa ${attempt}/5)`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`Groq ${r.status}: ${err.slice(0, 150)}`);
  }
  throw new Error('Groq: rate limit persistente após 5 tentativas');
}

// ── Parser JSON Seguro ────────────────────────────────────────────────────────
function parseJSON(text) {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch (_) {}
  
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

// ── Links internos (AdSense-friendly) ────────────────────────────────────────────
const INTERNAL_LINKS = [
  { href: '/noticias', label: 'mais notícias de cinema e séries' },
  { href: '/filmes',   label: 'filmes em destaque' },
  { href: '/series',   label: 'séries imperdíveis' },
  { href: '/blog',     label: 'nosso blog de cultura pop' },
  { href: '/noticias', label: 'últimas notícias do mundo do entretenimento' },
];

function pickInternalLinks() {
  const shuffled = [...INTERNAL_LINKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

// ── Prompt: Parafrasear mantendo estrutura HTML original ──────────────────────
function buildPrompt(title, rawContent) {
  const originalHtml = rawContent.trim().slice(0, 15000);
  const [link1, link2] = pickInternalLinks();

  return `Você é um editor do portal brasileiro "Deazons" (especializado em cultura pop, cinema e séries).
Sua tarefa é PARAFRASEAR o artigo HTML abaixo substituindo palavras por sinônimos equivalentes em português brasileiro, SEM alterar o sentido e SEM inventar informações.

REGRAS ABSOLUTAS — siga TODAS rigorosamente:
1. GERE HTML LIMPO E SEMÂNTICO: Use apenas tags limpas (<p>, <h2>, <h3>, <ul>, <li>, <blockquote>). OBRIGATÓRIO: Remova TODOS os atributos "class", "id" e "style" de todas as tags HTML. Não use "text-align" ou formatações inline.
2. IMAGENS: Mantenha as tags <img> originais, preservando APENAS os atributos "src" e "alt". Remova width, height, class e style das imagens. Opcionalmente, envolva as imagens em uma tag <figure> simples.
3. REMOVA todos os links externos (<a href> apontando para outros domínios) — substitua pelo texto âncora simples.
4. ADICIONE exatamente 2 links internos naturais no corpo do texto, nas posições onde façam sentido contextual:
   - Link A: <a href="${link1.href}">${link1.label}</a>
   - Link B: <a href="${link2.href}">${link2.label}</a>
5. APENAS substitua o TEXTO VISÍVEL por sinônimos naturais. Não invente fatos novos.
6. Mantenha o mesmo tom e tamanho do original. Se o texto estiver sem tags de parágrafo, FORMATE-O estruturando em múltiplos parágrafos usando a tag <p>.
7. O título pode ser levemente reescrito para ficar mais chamativo, mas deve manter o mesmo sentido.
8. ESTRUTURA HTML OBRIGATÓRIA: Todo o texto no campo "content" DEVE estar devidamente envelopado em tags HTML (como <p>, <h2>). NUNCA retorne um bloco gigante de texto sem tags de parágrafo.
9. NÃO inclua o <h1> no campo "content" (ele é renderizado separadamente no site).

Retorne APENAS um JSON válido, sem markdown, sem blocos de código, no formato:
{
  "title": "Título parafraseado e levemente mais chamativo",
  "slug": "titulo-em-kebab-case-sem-acentos",
  "meta_description": "Descrição de 150-160 caracteres baseada no artigo original.",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Escolha exatamente uma: Cinema | Séries | Marvel | DC | Lançamentos | Cultura Pop | Streaming | Anime",
  "content": "<p>HTML parafraseado com links internos inseridos...</p>"
}

ARTIGO ORIGINAL PARA PARAFRASEAR:
Título: ${title}
Conteúdo HTML: ${originalHtml}`;
}

// ── Injeção da Imagem de Capa (mantém imagens internas do HTML original) ──────
function injectCoverImage(html, mainImg, alt) {
  // NÃO remove imagens internas do HTML — elas vieram do feed original
  // Apenas injeta a imagem de capa (TMDB ou do próprio feed) após o 1º parágrafo
  const cover = `<figure style="margin: 0 0 2.5rem 0;">
  <img src="${mainImg}" alt="${alt}" style="width:100%; border-radius:16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</figure>`;

  // Verifica se o HTML já tem uma imagem de capa (src igual ao mainImg)
  if (html.includes(mainImg)) {
    // Imagem já está no conteúdo, não duplica
    return html;
  }

  const firstP = html.indexOf('</p>');
  if (firstP !== -1) {
    return html.substring(0, firstP + 4) + '\n' + cover + '\n' + html.substring(firstP + 4);
  }
  return cover + '\n' + html;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function wordCount(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length; }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Deazons — Geração de Artigos v4 (Alta Qualidade)`);
  console.log(`   ${new Date().toLocaleString('pt-BR')} | Max: ${MAX_PER_RUN} artigos\n`);

  const sources = await sbGet('rss_sources?active=eq.true&select=*');
  if (!sources.length) return console.log('Nenhum feed ativo.');
  
  // Misturar feeds para não pegar sempre do mesmo
  sources.sort(() => Math.random() - 0.5);

  let created = 0;

  outer:
  for (const src of sources) {
    console.log(`\n📰 ${src.name}`);
    let items;
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) { console.log(`  ❌ HTTP ${res.status}`); continue; }
      items = parseRss(await res.text());
      console.log(`  ↳ ${items.length} itens encontrados`);
      await sbPatch(`rss_sources?id=eq.${src.id}`, { last_fetched: new Date().toISOString() });
    } catch (e) { console.log(`  ❌ ${e.message}`); continue; }

    for (const item of items) {
      if (created >= MAX_PER_RUN) break outer;

      const title = decodeHtml(item.title);
      // Pula artigos vazios
      if (!item.content || item.content.length < 50) continue;

      // Filtro de idioma: rejeita títulos com caracteres não-latinos (vietnamita, chinês, árabe, etc.)
      if (/[\u0080-\u024F\u0370-\uFFFF&&[^\u00C0-\u024F]]/.test(title) ||
          /[\u0400-\u04FF\u0500-\u052F\u1E00-\u1EFF\u4E00-\u9FFF\uAC00-\uD7AF\u0600-\u06FF]/.test(title)) {
        console.log(`  ⏭️  Ignorado (idioma não suportado): ${title.slice(0, 50)}`);
        continue;
      }

      // Filtro de relevância: deve ter ao menos 1 palavra-chave de entretenimento no título ou conteúdo limpo
      const TOPIC_KEYWORDS = /film|movie|série|series|cinema|stream|netflix|disney|hbo|amazon|prime|apple tv|episód|temporada|ator|atriz|diretor|trailer|estreia|lançamento|marvel|dc |anime|bilheteria|oscar|emmy|golden globe|review|crítica|tv show|television/i;
      const contentSnippet = item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!TOPIC_KEYWORDS.test(title) && !TOPIC_KEYWORDS.test(contentSnippet.slice(0, 500))) {
        console.log(`  ⏭️  Ignorado (fora do tema): ${title.slice(0, 50)}`);
        continue;
      }

      // Filtro de tamanho mínimo: precisa ter ao menos 300 chars de texto
      if (contentSnippet.length < 300) {
        console.log(`  ⏭️  Ignorado (conteúdo muito curto: ${contentSnippet.length} chars): ${title.slice(0, 50)}`);
        continue;
      }

      const exists = await sbGet(`articles?source_url=eq.${encodeURIComponent(item.link)}&select=id&limit=1`);
      if (exists.length) { process.stdout.write('.'); continue; }

      console.log(`\n  [${created + 1}/${MAX_PER_RUN}] Em Análise: ${title.slice(0, 70)}`);

      // ── Conteúdo: usa RSS se completo, senão busca o artigo completo da URL ──
      let finalContent = item.content;
      const rssTextLen = contentSnippet.length;
      if (rssTextLen < 1500) {
        console.log(`  🔍 RSS curto (${rssTextLen} chars) — buscando artigo completo da URL...`);
        const fullHtml = await fetchFullContent(item.link);
        if (fullHtml) {
          finalContent = fullHtml;
        } else {
          console.log(`    ↳ Usando conteúdo do RSS mesmo assim.`);
        }
      }

      // Reextrair texto limpo do conteúdo final para checar tamanho real
      const finalText = finalContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (finalText.length < 300) {
        console.log(`  ⏭️  Ignorado (mesmo após fetch, conteúdo insuficiente: ${finalText.length} chars)`);
        continue;
      }
      console.log(`  📄 Conteúdo total disponível para paráfrase: ${finalText.length} chars`);

      const tmdb    = await getTMDB(title);
      const mainImg = tmdb?.main || item.img || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';

      let data;
      try {
        console.log('  🤖 Parafraseando com Groq (llama-3.3-70b)...');
        const raw = await callGroq(buildPrompt(title, finalContent));
        data = parseJSON(raw);
        if (!data?.content || data.content.length < 300) {
          console.log('  ❌ Resposta muito curta ou JSON inválido.');
          continue;
        }
      } catch (e) {
        console.log(`  ❌ Erro Groq: ${e.message}`);
        continue;
      }

      const wc = wordCount(data.content);
      console.log(`  📝 Qualidade: ${wc} palavras geradas`);

      const content = injectCoverImage(data.content, mainImg, data.title || title);
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
        category:         data.category || 'Cultura Pop',
        source_url:       item.link,
      });

      if (ok) {
        created++;
        console.log(`  ✅ PUBLICADO: "${(data.title || title).slice(0, 60)}"`);
      }

      if (created < MAX_PER_RUN) {
        console.log(`  ⏳ Aguardando ${DELAY_MS / 1000}s para evitar rate limit...`);
        await sleep(DELAY_MS);
      }
    }
  }

  console.log(`\n✨ ${created} artigos de alta qualidade criados.\n`);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
