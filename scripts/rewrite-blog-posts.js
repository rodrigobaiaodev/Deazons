/**
 * rewrite-blog-posts.js — Reescrita Completa dos Posts do Blog
 *
 * Para cada post stub do blog:
 * 1. Busca imagens do Pexels API usando a searchQuery do post
 * 2. Usa Groq (llama-3.3-70b) para gerar conteúdo rico (1500+ palavras)
 * 3. Gera arquivo TSX completo com imagens embutidas
 * 4. Atualiza images.json
 *
 * Uso: node scripts/rewrite-blog-posts.js
 * Flags: --force (reescreve mesmo posts que já têm conteúdo)
 *        --only=slug1,slug2 (reescreve apenas slugs específicos)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── .env.local ────────────────────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const i = line.indexOf('=');
    if (i < 1) return;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  });
}

const GROQ_KEY   = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

if (!GROQ_KEY)   { console.error('❌ GROQ_API_KEY não encontrada no .env.local'); process.exit(1); }
if (!PEXELS_KEY) { console.error('❌ PEXELS_API_KEY não encontrada no .env.local'); process.exit(1); }

// ── Flags ─────────────────────────────────────────────────────────────────────
const FORCE    = process.argv.includes('--force');
const onlyArg  = process.argv.find(a => a.startsWith('--only='));
const ONLY     = onlyArg ? onlyArg.replace('--only=', '').split(',') : null;
const DELAY_MS = 8000;
// Limite de tamanho para considerar "stub" (bytes do arquivo TSX)
const STUB_SIZE_LIMIT = 2000;

// ── Posts List ────────────────────────────────────────────────────────────────
const postsFilePath = pathToFileURL(path.join(ROOT, 'src/blog/data/posts.js')).href;
const { blogPosts } = await import(postsFilePath);

// ── images.json ───────────────────────────────────────────────────────────────
const imagesPath = path.join(ROOT, 'src/blog/data/images.json');
let imagesData = {};
try { imagesData = JSON.parse(fs.readFileSync(imagesPath, 'utf-8')); } catch (_) {}

// ── Utils ──────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escapeReact(str) {
  // Escapes para JSX: { } e className
  return str
    .replace(/className=/g, 'className=')  // já está ok
    .replace(/class=/g, 'className=');     // converte HTML puro
}

// ── Pexels ────────────────────────────────────────────────────────────────────
async function fetchPexels(query, count = 3) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (!r.ok) { console.warn(`  ⚠️  Pexels ${r.status} para "${query}"`); return []; }
    const data = await r.json();
    return (data.photos || []).map(p => ({
      url:               `${p.src.large2x}`,
      alt:               p.alt || query,
      photographer:      p.photographer,
      photographer_url:  p.photographer_url,
    }));
  } catch (e) {
    console.warn(`  ⚠️  Pexels erro: ${e.message}`);
    return [];
  }
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
        temperature: 0.75,
        max_tokens: 7000,
      }),
    });
    if (r.ok) {
      const d = await r.json();
      return d?.choices?.[0]?.message?.content || '';
    }
    const err = await r.text();
    if (r.status === 429) {
      const secs = (err.match(/try again in ([\d.]+)s/) || [])[1];
      const wait = Math.ceil(parseFloat(secs || '30')) + 5;
      console.log(`  ⏳ Rate limit Groq — aguardando ${wait}s... (${attempt}/3)`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`Groq ${r.status}: ${err.slice(0, 150)}`);
  }
  throw new Error('Groq: rate limit persistente');
}

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(post) {
  return `Você é o editor-chefe do blog "Deazons" — o maior portal brasileiro de cinema, séries e streaming.
Escreva um artigo COMPLETO, APROFUNDADO e EXTREMAMENTE RICO sobre o seguinte tema.

TEMA: "${post.title}"
DESCRIÇÃO BASE: "${post.description}"

REGRAS OBRIGATÓRIAS:
1. O artigo DEVE ter NO MÍNIMO 1.500 palavras (conteúdo denso e aprofundado).
2. Use exatamente 7 subtítulos <h2> com IDs para âncoras (ex: <h2 id="intro">).
3. Crie um índice navegável no início com <nav> e links âncora para cada seção.
4. Use pelo menos 2 <blockquote> com citações de especialistas, críticos ou dados de pesquisa.
5. Use pelo menos 2 <ul> com listas de dicas, curiosidades ou recomendações.
6. Destaque termos importantes em <strong>.
7. Adicione uma seção final de FAQ com 5 perguntas e respostas detalhadas dentro de <details>/<summary>.
8. NUNCA inclua <img> tags — as imagens serão injetadas depois.
9. Use linguagem de revista especializada: culta mas acessível, com personalidade.
10. Retorne APENAS o HTML do corpo do artigo — sem <!DOCTYPE>, <html>, <head> ou <body>.
11. Use apenas tags HTML válidas: <h2>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>, <nav>, <details>, <summary>.

Escreva o artigo completo agora:`;
}

// ── Gerador de TSX ────────────────────────────────────────────────────────────
function generateTSX(post, htmlContent, images) {
  const img1 = images[0] ? images[0].url : 'https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
  const img2 = images[1] ? images[1].url : img1;
  const img3 = images[2] ? images[2].url : img2;
  const alt1 = images[0] ? images[0].alt.replace(/"/g, "'") : post.title;
  const alt2 = images[1] ? images[1].alt.replace(/"/g, "'") : post.title;
  const alt3 = images[2] ? images[2].alt.replace(/"/g, "'") : post.title;
  const photo1 = images[0] ? `Foto: ${images[0].photographer}` : '';
  const photo2 = images[1] ? `Foto: ${images[1].photographer}` : '';

  // Clean HTML: remove any existing img tags, fix attributes
  let cleanHtml = htmlContent
    .replace(/<img[^>]*>/gi, '')
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/\r\n/g, '\n')
    .trim();

  // Inject image 1 after first </p>
  const firstPClose = cleanHtml.indexOf('</p>');
  if (firstPClose !== -1) {
    const imgBlock = `\n<figure style="margin: 2rem 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);"><img src="${img1}" alt="${alt1}" style="width: 100%; display: block;" loading="lazy" /><figcaption style="font-size: 0.75rem; color: #888; text-align: center; padding: 0.5rem;">${photo1}</figcaption></figure>\n`;
    cleanHtml = cleanHtml.substring(0, firstPClose + 4) + imgBlock + cleanHtml.substring(firstPClose + 4);
  }

  // Inject image 2 before the 4th h2
  let h2Count = 0;
  cleanHtml = cleanHtml.replace(/<h2/g, (match) => {
    h2Count++;
    if (h2Count === 4) {
      const imgBlock = `<figure style="margin: 2rem 0; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.25);"><img src="${img2}" alt="${alt2}" style="width: 100%; display: block;" loading="lazy" /><figcaption style="font-size: 0.75rem; color: #888; text-align: center; padding: 0.5rem;">${photo2}</figcaption></figure>\n`;
      return imgBlock + match;
    }
    return match;
  });

  // Encode as JSON string to avoid all template literal issues
  const htmlJson = JSON.stringify(cleanHtml);

  return `import React from "react";

export default function ${post.componentName}({ images }: { images: any[] }) {
  const img1 = images[0]?.url || "${img1}";
  const img2 = images[1]?.url || "${img2}";
  const img3 = images[2]?.url || "${img3}";

  const htmlContent: string = ${htmlJson};

  return (
    <>
      <figure className="mb-10 -mt-4 rounded-2xl overflow-hidden shadow-2xl">
        <img
          src={img1}
          alt="${alt1}"
          className="w-full h-72 object-cover"
          loading="eager"
        />
      </figure>

      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

      <figure className="mt-10 rounded-2xl overflow-hidden shadow-xl">
        <img
          src={img3}
          alt="${alt3}"
          className="w-full object-cover"
          loading="lazy"
        />
      </figure>
    </>
  );
}
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Deazons Blog — Reescrita com Pexels + Groq');
  console.log(`   ${new Date().toLocaleString('pt-BR')}\n`);

  const postsDir = path.join(ROOT, 'src/blog/posts');
  let rewritten = 0;
  let skipped   = 0;

  for (const post of blogPosts) {
    // Filtro --only
    if (ONLY && !ONLY.includes(post.slug)) { skipped++; continue; }

    const tsxFile = path.join(postsDir, `${post.componentName}.tsx`);
    const fileSize = fs.existsSync(tsxFile) ? fs.statSync(tsxFile).size : 0;
    const isStub   = fileSize < STUB_SIZE_LIMIT;

    if (!isStub && !FORCE) {
      console.log(`⏭️  Pulando (já completo, ${fileSize} bytes): ${post.slug}`);
      skipped++;
      continue;
    }

    console.log(`\n📝 [${rewritten + 1}] ${post.slug} (${fileSize} bytes — ${isStub ? 'STUB' : 'forçado'})`);

    // ── Pexels ────
    let images = imagesData[post.slug] || [];
    if (images.length < 3) {
      console.log(`  🖼️  Buscando imagens no Pexels: "${post.searchQuery}"`);
      const pexelsImages = await fetchPexels(post.searchQuery, 3);
      if (pexelsImages.length > 0) {
        images = pexelsImages;
        imagesData[post.slug] = images;
        console.log(`  ✅ ${images.length} imagens obtidas do Pexels`);
      } else {
        console.log(`  ⚠️  Sem imagens do Pexels — usando fallback`);
      }
    } else {
      console.log(`  ✅ Imagens já existentes (${images.length})`);
    }

    // ── Groq ──────
    console.log(`  🤖 Gerando artigo com Groq...`);
    let htmlContent;
    try {
      htmlContent = await callGroq(buildPrompt(post));
      if (!htmlContent || htmlContent.length < 1000) {
        console.log(`  ❌ Resposta muito curta (${htmlContent?.length || 0} chars) — pulando`);
        continue;
      }
      console.log(`  ✅ ${htmlContent.length} chars gerados`);
    } catch (e) {
      console.error(`  ❌ Erro Groq: ${e.message}`);
      continue;
    }

    // ── TSX ───────
    try {
      const tsx = generateTSX(post, htmlContent, images);
      fs.writeFileSync(tsxFile, tsx, 'utf-8');
      console.log(`  💾 Salvo: ${post.componentName}.tsx (${tsx.length} bytes)`);
    } catch (e) {
      console.error(`  ❌ Erro ao salvar TSX: ${e.message}`);
      continue;
    }

    rewritten++;

    if (rewritten < blogPosts.length) {
      console.log(`  ⏳ Aguardando ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
    }
  }

  // ── Salva images.json ─────────────────────────────────────────────────────
  fs.writeFileSync(imagesPath, JSON.stringify(imagesData, null, 2), 'utf-8');
  console.log('\n💾 images.json atualizado');
  console.log(`\n✨ Concluído! ${rewritten} posts reescritos, ${skipped} pulados.\n`);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
