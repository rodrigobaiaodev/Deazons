import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // Requires node version that supports fetch or npm install node-fetch

const loadEnv = () => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch (e) {
    console.error('Erro ao ler .env.local:', e.message);
  }
};

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const tmdbKey = process.env.VITE_TMDB_API_KEY || "6ea976a00b674fb5087f7e37ff72f45c";
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error('❌ Erro: Credenciais Supabase ou Gemini não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

const extractTags = (item) => {
  if (item.categories && Array.isArray(item.categories)) {
    return item.categories;
  }
  return [];
};

const parseGeminiResponse = (text) => {
  try {
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanText);
    } catch (e) {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("JSON Object not found.");
    }
  } catch (err) {
    console.error("Erro ao parsear resposta Gemini:", err.message);
    return null;
  }
};

const extractImage = (item) => {
  if (item.enclosure && item.enclosure.link) return item.enclosure.link;
  if (item.thumbnail) return item.thumbnail;
  const content = item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) return imgMatch[1];
  return null;
};

const getTMDBImages = async (title) => {
  const images = { main: null, extra1: null, extra2: null };
  try {
    const searchTitle = title
      .replace(/Review|Crítica|Trailer|Teaser|Confirmado|Rumor|Entrevista/gi, '')
      .split(':')[0]
      .split('-')[0]
      .trim();

    if (!searchTitle) return images;

    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&language=pt-BR&query=${encodeURIComponent(searchTitle)}`);
    const data = await res.json();
    const results = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');

    if (results.length > 0) {
      const first = results[0];
      if (first.backdrop_path) images.main = `https://image.tmdb.org/t/p/w1280${first.backdrop_path}`;
      else if (first.poster_path) images.main = `https://image.tmdb.org/t/p/w780${first.poster_path}`;

      const extraImages = [];
      results.forEach(res => {
        if (res.backdrop_path) {
          const url = `https://image.tmdb.org/t/p/w780${res.backdrop_path}`;
          if (url !== images.main && !extraImages.includes(url)) extraImages.push(url);
        }
        if (res.poster_path) {
          const url = `https://image.tmdb.org/t/p/w780${res.poster_path}`;
          if (url !== images.main && !extraImages.includes(url)) extraImages.push(url);
        }
      });

      if (extraImages.length > 0) images.extra1 = extraImages[0];
      if (extraImages.length > 1) images.extra2 = extraImages[1];
    }
    return images;
  } catch (error) {
    return images;
  }
};

async function main() {
  console.log('🤖 Iniciando Automação de RSS -> Gemini -> Supabase (PUBLISHED direct)');
  
  const { data: sources, error } = await supabase.from('rss_sources').select('*').eq('active', true);
  if (error || !sources || sources.length === 0) {
    console.log('Nenhuma fonte ativa encontrada.');
    process.exit(0);
  }

  for (const source of sources) {
    console.log(`Lendo feed: ${source.name}...`);
    try {
      const response = await fetch(`${RSS2JSON_API}${encodeURIComponent(source.url)}`);
      const data = await response.json();
      if (data.status !== 'ok') continue;

      const items = data.items || [];
      await supabase.from('rss_sources').update({ last_fetched: new Date().toISOString() }).eq('id', source.id);

      for (const item of items) {
        if (!item.link || !item.title) continue;

        const { data: existing } = await supabase.from('articles').select('id').eq('source_url', item.link).single();
        if (existing) continue;

        console.log(`Processando: ${item.title}`);
        
        let imageUrl = extractImage(item);
        const tmdbImages = await getTMDBImages(item.title);
        if (!imageUrl) imageUrl = tmdbImages.main;

        const prompt = `
Aja como um redator especialista em cultura pop (filmes, séries, streaming).
Sua tarefa é reescrever o texto do artigo de uma forma original.

Título Original: ${item.title}
Conteúdo Base: ${item.content || item.description || ''}

Gere um JSON com:
- title: Título cativante (sem emojis)
- slug: slug amigável
- meta_description: descrição de até 150 caracteres para SEO
- category: "Filmes", "Series", ou "Noticias"
- tags: Array de até 5 tags
- content: Conteúdo completo em HTML (h2, p, ul). No mínimo 600 palavras.

Regras do Content:
- Use H2 para no mínimo 4 subtítulos ao longo do texto.
- Não insira o título original no content.
- Comece de vez em um parágrafo inicial forte dando a notícia/fato principal.

${imageUrl ? `Sempre inclua NO TOPO do primeiro parágrafo: <img src="${imageUrl}" alt="Imagem do Post" style="width:100%;object-fit:cover;border-radius:12px;margin-bottom:20px;" />` : ''}

${tmdbImages.extra1 ? `Logo após o primeiro H2, insira e comente sobre essa cena/poster: <img src="${tmdbImages.extra1}" alt="Cena 1" style="width:100%;border-radius:12px;margin:20px 0;" />` : ''}

${tmdbImages.extra2 ? `Logo após o terceiro H2, insira: <img src="${tmdbImages.extra2}" alt="Cena 2" style="width:100%;border-radius:12px;margin:20px 0;" />` : ''}
`;

        try {
          const result = await geminiModel.generateContent(prompt);
          const response = await result.response;
          const articleData = parseGeminiResponse(response.text());

          if (articleData) {
            const newArticle = {
              title: articleData.title,
              slug: articleData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              content: articleData.content,
              meta_description: articleData.meta_description,
              status: 'published',
              published_at: new Date().toISOString(),
              image_url: imageUrl,
              image_alt: articleData.title,
              tags: articleData.tags || extractTags(item),
              category: articleData.category,
              source_url: item.link
            };

            await supabase.from('articles').insert(newArticle);
            console.log(`✅ Postado: ${articleData.title}`);
          }
        } catch (e) {
          console.error(`Erro Gemini: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 6000));
      }
    } catch(err) {
      console.error(`Erro Fonte ${source.name}: ${err.message}`);
    }
  }
  
  // Após terminar de puxar e postar artigos, gera novamente o sitemap:
  await import('./generate-sitemap.js').catch(e => console.log('Sitemap trigger failed', e.message));
  console.log('🎉 100% finalizado.');
}

main();
