
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbKey = process.env.VITE_TMDB_API_KEY || "6ea976a00b674fb5087f7e37ff72f45c";
const BASE_URL = 'https://deazons.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Credenciais Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const slugify = (text) => {
  if (!text) return 'item';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const createSitemapXml = (urls) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>` : ''}
    <priority>${url.priority || '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;
};

async function generateSitemaps() {
  console.log('🚀 Iniciando Geração de Sitemaps Expandidos...');
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  const sitemaps = [];

  // 1. Static Pages
  const pagesUrls = [
    { loc: `${BASE_URL}/`, priority: '1.0' },
    { loc: `${BASE_URL}/noticias`, priority: '0.9' },
    { loc: `${BASE_URL}/filmes`, priority: '0.8' },
    { loc: `${BASE_URL}/series`, priority: '0.8' },
    { loc: `${BASE_URL}/pessoas`, priority: '0.7' },
  ];
  fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), createSitemapXml(pagesUrls));
  sitemaps.push('sitemap-pages.xml');
  console.log('✅ sitemap-pages.xml gerado.');

  // 2. Articles (Supabase)
  console.log('📦 Buscando artigos no Supabase...');
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, created_at')
    .eq('status', 'published');

  if (articles) {
    const artUrls = articles.map(art => ({
      loc: `${BASE_URL}/noticias/${art.slug}`,
      lastmod: new Date(art.created_at).toISOString().split('T')[0],
      priority: '0.8'
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-articles.xml'), createSitemapXml(artUrls));
    sitemaps.push('sitemap-articles.xml');
    console.log(`✅ sitemap-articles.xml gerado (${artUrls.length} links).`);
  }

  // Helper for TMDB pagination
  const fetchTMDBPages = async (endpoint, maxPages) => {
    let results = [];
    for (let i = 1; i <= maxPages; i++) {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${tmdbKey}&language=pt-BR&page=${i}`);
            const data = await res.json();
            if (data.results) results = [...results, ...data.results];
        } catch (e) {
            console.error(`Erro na página ${i} de ${endpoint}`);
        }
    }
    return results;
  };

  if (tmdbKey) {
    // 3. Movies
    console.log('🎬 Buscando Filmes (20 páginas)...');
    const movies = await fetchTMDBPages('movie/popular', 20);
    const movieUrls = movies.map(m => ({
      loc: `${BASE_URL}/filmes/${m.id}-${slugify(m.title)}`,
      priority: '0.6'
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-movies.xml'), createSitemapXml(movieUrls));
    sitemaps.push('sitemap-movies.xml');
    console.log(`✅ sitemap-movies.xml gerado (${movieUrls.length} links).`);

    // 4. Series
    console.log('📺 Buscando Séries (20 páginas)...');
    const series = await fetchTMDBPages('tv/popular', 20);
    const seriesUrls = series.map(s => ({
      loc: `${BASE_URL}/series/${s.id}-${slugify(s.name)}`,
      priority: '0.6'
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-series.xml'), createSitemapXml(seriesUrls));
    sitemaps.push('sitemap-series.xml');
    console.log(`✅ sitemap-series.xml gerado (${seriesUrls.length} links).`);

    // 5. People
    console.log('👤 Buscando Pessoas (10 páginas)...');
    const people = await fetchTMDBPages('person/popular', 10);
    const peopleUrls = people.map(p => ({
      loc: `${BASE_URL}/pessoas/${p.id}-${slugify(p.name)}`,
      priority: '0.5'
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-people.xml'), createSitemapXml(peopleUrls));
    sitemaps.push('sitemap-people.xml');
    console.log(`✅ sitemap-people.xml gerado (${peopleUrls.length} links).`);
  }

  // 6. Generate Index Sitemap
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sm => `  <sitemap>
    <loc>${BASE_URL}/${sm}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), indexXml);
  console.log('✅ sitemap-index.xml gerado.');

  console.log('✨ Processo concluído com sucesso!');
}

generateSitemaps();
