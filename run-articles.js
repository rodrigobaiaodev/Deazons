/**
 * run-articles.js  — v4 (AdSense Ready, Alta Qualidade)
 * 
 * Busca feeds RSS ativos do Supabase, reescreve com Groq (llama-3.3-70b)
 * gerando artigos MASSIVOS (1500+ palavras), originais e otimizados para SEO.
 * Injeta imagens do TMDB e salva no Supabase.
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

const MAX_PER_RUN   = process.env.MAX_PER_RUN ? parseInt(process.env.MAX_PER_RUN, 10) : 4;
const DELAY_MS      = 12000; 

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
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
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
      const wait = Math.ceil(parseFloat(secs || '30')) + 10;
      console.log(`  ⏳ Rate limit — aguardando ${wait}s... (tentativa ${attempt}/3)`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`Groq ${r.status}: ${err.slice(0, 150)}`);
  }
  throw new Error('Groq: rate limit persistente após 3 tentativas');
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

// ── Prompt Extenso e Detalhado ────────────────────────────────────────────────
function buildPrompt(title, rawContent) {
  const content = rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);

  return `Você é um redator sênior do portal brasileiro "Deazons" (especializado em cultura pop, cinema e séries). 
Seu objetivo é escrever um artigo ÉPICO, PROFUNDO e EXTREMAMENTE ENVOLVENTE (aprovado para Google AdSense).

A fonte original (veja abaixo) deve ser APENAS o ponto de partida. Você deve REESCREVER TOTALMENTE o texto, EXPANDINDO o assunto de forma autoral, detalhada, rica em contexto e análises críticas. NÃO traduza ou copie; seja criativo!

REGRAS OBRIGATÓRIAS DO ARTIGO:
1. Tamanho: o artigo DEVE ser MASSIVO, com pelo menos 15 parágrafos extensos, análises profundas e MAIS DE 1000 PALAVRAS REAIS. É estritamente proibido gerar textos curtos ou resumos rasos. Aprofunde a análise o máximo possível, trazendo contexto, histórico e opiniões fortes.
2. Estrutura SEO: use uma hierarquia perfeita com introdução, múltiplos subtítulos <h2> e <h3> envolventes, e uma conclusão forte. O Google ama essa estrutura.
3. Formatação: inclua pelo menos 1 <blockquote> (citação de personagem ou crítica), 1 <ul> (lista de curiosidades ou pontos chave) e destaque partes importantes em <strong>.
4. Links Internos: Inclua pelo menos 2 links internos naturais usando a tag <a href="/noticias">leia mais notícias aqui</a> ou <a href="/filmes">veja nossa seção de filmes</a>, espalhados pelo texto.
5. NUNCA coloque tags de imagem (<img>) no texto gerado (nós injetamos via script).
6. NUNCA mencione que a notícia veio de um site ou "fonte original". Haja como se o Deazons tivesse feito a análise primária.
7. A linguagem deve ser de revista especializada, mantendo o usuário engajado do começo ao fim.

Retorne APENAS um JSON estrito, sem markdown, no formato:
{
  "title": "Crie um título novo, altamente chamativo (clickbait do bem), intrigante e com pegada SEO",
  "slug": "crie-um-slug-em-minusculas-separado-por-hifen",
  "meta_description": "Crie uma descrição intrigante e instigante de 150 caracteres para chamar o leitor do Google.",
  "tags": ["3 a 5 tags focadas (ex: Filme X, Diretor Y, Netflix)"],
  "category": "Escolha exatamente uma: Cinema OU Séries OU Cultura Pop",
  "content": "<p>Seu primeiro parágrafo envolvente aqui...</p><h2>Subtítulo envolvente</h2><p>Restante do artigo profundo e expansivo...</p>"
}

Assunto Base para o seu artigo:
Título: ${title}
Rascunho de Informações: ${content}`;
}

// ── Injeção de Imagens ────────────────────────────────────────────────────────
function injectImages(html, mainImg, posterImg, alt, extraImages = []) {
  let c = html.replace(/<img[^>]*>/gi, '').replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '').trim();

  // Imagem de destaque logo após o primeiro parágrafo
  const cover = `<figure style="margin: 0 0 2.5rem 0;">
  <img src="${mainImg}" alt="${alt}" style="width:100%; border-radius:16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</figure>`;

  // Achar o primeiro </p>
  const firstP = c.indexOf('</p>');
  if (firstP !== -1) {
    c = c.substring(0, firstP + 4) + '\n' + cover + '\n' + c.substring(firstP + 4);
  } else {
    c = cover + '\n' + c;
  }

  let imgIndex = 0;
  let cnt = 0;
  
  c = c.replace(/<h2/gi, m => { 
    cnt++; 
    let extra = '';
    
    // Poster no 3º H2
    if (cnt === 3 && posterImg && posterImg !== mainImg) {
      extra = `<figure style="margin: 3rem 0;"><img src="${posterImg}" alt="${alt} Poster" style="width:100%; max-width: 500px; margin: 0 auto; display: block; border-radius:12px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);"/></figure>\n`;
    } 
    // Imagens extras nos H2 ímpares após o 3º
    else if (cnt > 3 && cnt % 2 !== 0 && imgIndex < extraImages.length) {
      let currentExtra = extraImages[imgIndex];
      // Ignora se for duplicada da principal
      if (currentExtra !== mainImg && currentExtra !== posterImg) {
        extra = `<figure style="margin: 3rem 0;"><img src="${currentExtra}" alt="${alt} - Cena" style="width:100%; max-width: 800px; margin: 0 auto; display: block; border-radius:12px;"/></figure>\n`;
      }
      imgIndex++;
    }
    
    return extra + m; 
  });

  return c;
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
      // Pula artigos que parecem vazios ou muito irrelevantes
      if (!item.content || item.content.length < 50) continue;

      const exists = await sbGet(`articles?source_url=eq.${encodeURIComponent(item.link)}&select=id&limit=1`);
      if (exists.length) { process.stdout.write('.'); continue; }

      console.log(`\n  [${created + 1}/${MAX_PER_RUN}] Em Análise: ${title.slice(0, 70)}`);

      const tmdb = await getTMDB(title);
      const mainImg   = tmdb?.main   || item.img || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
      const posterImg = tmdb?.poster || null;

      let data;
      try {
        console.log('  🤖 Gerando artigo extenso e autoral (Groq)...');
        const raw = await callGroq(buildPrompt(title, item.content));
        data = parseJSON(raw);
        if (!data?.content || data.content.length < 500) {
          console.log('  ❌ Resposta muito curta ou JSON inválido.');
          continue;
        }
      } catch (e) {
        console.log(`  ❌ Erro Groq: ${e.message}`);
        continue;
      }

      const wc = wordCount(data.content);
      console.log(`  📝 Qualidade: ${wc} palavras geradas`);

      const content = injectImages(data.content, mainImg, posterImg, data.title || title, item.extraImages);
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
