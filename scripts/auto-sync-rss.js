import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─── Load .env.local ─────────────────────────────────────────────────────────
const loadEnv = () => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) return;
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !(key in process.env)) {
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.error('Erro ao ler .env.local:', e.message);
  }
};

loadEnv();

// ─── Config ───────────────────────────────────────────────────────────────────
const supabaseUrl  = process.env.VITE_SUPABASE_URL;
const supabaseKey  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const tmdbKey      = process.env.VITE_TMDB_API_KEY || '6ea976a00b674fb5087f7e37ff72f45c';
const groqApiKey   = process.env.GROQ_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Credenciais Supabase não encontradas em .env.local');
  process.exit(1);
}
if (!groqApiKey) {
  console.error('❌ Erro: GROQ_API_KEY não encontrada em .env.local');
  console.error('   Adicione a linha: GROQ_API_KEY=gsk_...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Groq REST call ───────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.75,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ─── RSS parser ───────────────────────────────────────────────────────────────
const parseRssXml = (xmlStr) => {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  const getTag = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
    const m = xml.match(regex);
    return m ? m[1].trim() : null;
  };

  const getAttribute = (xml, tag, attr) => {
    const regex = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
    const m = xml.match(regex);
    return m ? m[1] : null;
  };

  while ((match = itemRegex.exec(xmlStr)) !== null) {
    const itemXml = match[1];
    const title       = getTag(itemXml, 'title');
    const link        = getTag(itemXml, 'link');
    const description = getTag(itemXml, 'description');
    const content     = getTag(itemXml, 'content:encoded');
    const pubDate     = getTag(itemXml, 'pubDate');

    const categories = [];
    const catRegex = /<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(itemXml)) !== null) {
      categories.push(catMatch[1].trim());
    }

    let imageUrl = getAttribute(itemXml, 'media:content', 'url') || getAttribute(itemXml, 'enclosure', 'url');
    if (!imageUrl && content) {
      const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) imageUrl = m[1];
    }
    if (!imageUrl && description) {
      const m = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) imageUrl = m[1];
    }

    if (title && link) {
      items.push({
        title,
        link,
        content: content || description || '',
        description: content || description || '',
        pubDate,
        thumbnail: imageUrl,
        enclosure: imageUrl ? { link: imageUrl } : null,
        categories,
      });
    }
  }
  return items;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractImage = (item) => {
  if (item.enclosure?.link) return item.enclosure.link;
  if (item.thumbnail) return item.thumbnail;
  const c = item.content || item.description || '';
  const m = c.match(/<img[^>]+src="([^">]+)"/);
  return m ? m[1] : null;
};

const parseGroqResponse = (text) => {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(clean); } catch (_) {}
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    return null;
  } catch (err) {
    console.error('  ⚠️  Erro ao parsear JSON do Groq:', err.message);
    return null;
  }
};

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 90);

const getTMDBImage = async (title) => {
  try {
    const q = title
      .replace(/Review|Crítica|Trailer|Teaser|Confirmado|Rumor|Entrevista|Veja|Assista/gi, '')
      .split(':')[0].split('-')[0].trim();
    if (!q) return null;
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&language=pt-BR&query=${encodeURIComponent(q)}`
    );
    const data = await res.json();
    const results = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    if (!results.length) return null;
    const first = results[0];
    if (first.backdrop_path) return `https://image.tmdb.org/t/p/w1280${first.backdrop_path}`;
    if (first.poster_path)   return `https://image.tmdb.org/t/p/w780${first.poster_path}`;
    return null;
  } catch { return null; }
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const MAX_ARTICLES = 10;
const DELAY_MS     = 7000; // respeitar rate limit do Groq

async function main() {
  console.log('🤖 Iniciando Automação de RSS → Groq → Supabase');
  console.log(`   Modelo: llama-3.3-70b-versatile`);
  console.log(`   Máximo por execução: ${MAX_ARTICLES} artigos\n`);

  const { data: sources, error } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('active', true);

  if (error || !sources || sources.length === 0) {
    console.log('ℹ️  Nenhuma fonte RSS ativa encontrada no banco.');
    process.exit(0);
  }

  console.log(`📡 ${sources.length} fonte(s) ativa(s) encontrada(s).\n`);

  let articlesCreated = 0;

  outerLoop:
  for (const source of sources) {
    console.log(`📰 Feed: ${source.name} (${source.url})`);

    let items = [];
    try {
      const feedRes = await fetch(source.url, { signal: AbortSignal.timeout(15000) });
      const xmlData = await feedRes.text();
      items = parseRssXml(xmlData);

      if (items.length === 0) {
        console.log(`  ⚠️  Nenhum item encontrado no feed.\n`);
        continue;
      }

      await supabase
        .from('rss_sources')
        .update({ last_fetched: new Date().toISOString() })
        .eq('id', source.id);

      console.log(`  ↳ ${items.length} itens encontrados.`);
    } catch (err) {
      console.error(`  ❌ Erro ao ler feed: ${err.message}\n`);
      continue;
    }

    for (const item of items) {
      if (articlesCreated >= MAX_ARTICLES) break outerLoop;
      if (!item.link || !item.title) continue;

      // Verificar duplicata
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('source_url', item.link)
        .single();

      if (existing) continue;

      console.log(`\n  ✏️  (${articlesCreated + 1}/${MAX_ARTICLES}) ${item.title.substring(0, 70)}`);

      // Imagem: TMDB primeiro, fallback para RSS
      process.stdout.write(`      🖼️  Buscando imagem no TMDB... `);
      let imageUrl = await getTMDBImage(item.title);
      if (imageUrl) {
        console.log('✓ encontrada');
      } else {
        console.log('não encontrada. Usando fallback do RSS.');
        imageUrl = extractImage(item);
      }
      
      if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
      }

      const rawContent = (item.content || item.description || '').substring(0, 3000);

      const prompt = `Você é um redator sênior do portal de entretenimento "Deazons" (Brasil).
Reescreva o artigo abaixo em português brasileiro de forma 100% original, autoritativa e otimizada para SEO.

REGRAS:
1. Mínimo de 600 palavras. Tom envolvente, opinativo e "nerd" profissional.
2. Exatamente 4 subtítulos <h2> com palavras-chave relevantes para SEO.
3. NÃO mencione o site de origem.
4. NÃO inclua tags <img> no content.
5. NÃO inclua o <h1> no content (ele é renderizado separadamente).
6. O campo "content" deve conter apenas: <p>, <h2>, e listas <ul>/<li>.

FORMATO — responda APENAS com JSON válido (sem markdown, sem \`\`\`):
{
  "title": "Título reescrito, chamativo e com palavra-chave",
  "slug": "titulo-em-kebab-case-sem-acentos",
  "meta_description": "Descrição entre 150-160 caracteres",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Uma de: Cinema, Séries, Marvel, DC, Lançamentos, Cultura Pop, Streaming, Anime",
  "content": "<p>Introdução...</p><h2>Subtítulo 1</h2><p>...</p><h2>Subtítulo 2</h2><p>...</p><h2>Subtítulo 3</h2><p>...</p><h2>Conclusão</h2><p>...</p>"
}

NOTÍCIA ORIGINAL:
Título: ${item.title}
Conteúdo: ${rawContent}`;

      try {
        process.stdout.write(`      🤖 Chamando Groq...`);
        const aiText = await callGroq(prompt);
        console.log(' ✓');

        const articleData = parseGroqResponse(aiText);
        if (!articleData) {
          console.log(`      ❌ Falha ao parsear resposta JSON.`);
          continue;
        }

        const cleanContent = (articleData.content || '')
          .replace(/<img[^>]*\/?>/gi, '')
          .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
          .trim();

        const newArticle = {
          title:            articleData.title || item.title,
          slug:             slugify(articleData.slug || articleData.title || item.title),
          content:          cleanContent,
          meta_description: (articleData.meta_description || '').substring(0, 160),
          status:           'published',
          published_at:     new Date().toISOString(),
          image_url:        imageUrl,
          image_alt:        articleData.title || item.title,
          tags:             articleData.tags || [],
          category:         articleData.category || 'Cinema',
          source_url:       item.link,
        };

        const { error: insertError } = await supabase.from('articles').insert(newArticle);

        if (insertError) {
          console.log(`      ❌ Erro ao salvar no Supabase: ${insertError.message}`);
        } else {
          articlesCreated++;
          console.log(`      ✅ Salvo: "${newArticle.title.substring(0, 60)}"`);
        }
      } catch (err) {
        console.error(`      ❌ Erro Groq: ${err.message}`);
        if (err.message.includes('429')) {
          console.log(`      ⏳ Rate limit — aguardando 30s...`);
          await new Promise(r => setTimeout(r, 30000));
        }
      }

      if (articlesCreated < MAX_ARTICLES) {
        console.log(`      ⏱️  Aguardando ${DELAY_MS / 1000}s (rate limit)...`);
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    console.log('');
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`📊 Resumo: ${articlesCreated} artigo(s) criado(s) nesta execução.`);

  // Regenerar sitemap após novos artigos
  if (articlesCreated > 0) {
    console.log('🗺️  Gerando sitemap...');
    await import('./generate-sitemap.js').catch(e =>
      console.warn('  ⚠️  Sitemap não gerado:', e.message)
    );
  }

  console.log('🎉 Finalizado.');
}

main().catch(err => {
  console.error('💥 Erro fatal:', err.message);
  process.exit(1);
});
