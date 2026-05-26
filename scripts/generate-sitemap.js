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
const tmdbKey = process.env.VITE_TMDB_API_KEY || '6ea976a00b674fb5087f7e37ff72f45c';
const BASE_URL = 'https://deazons.com';
const TODAY = new Date().toISOString().split('T')[0];

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
    <lastmod>${url.lastmod || TODAY}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;
};

async function generateSitemaps() {
  console.log('🚀 Iniciando Geração de Sitemaps Expandidos...');
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  // Tracks static XML files generated (articles use the dynamic /api/sitemap-articles endpoint)
  const staticSitemaps = [];

  // 1. Static Pages
  const pagesUrls = [
    { loc: `${BASE_URL}/`,            priority: '1.0', changefreq: 'daily'   },
    { loc: `${BASE_URL}/filmes`,      priority: '0.9', changefreq: 'daily'   },
    { loc: `${BASE_URL}/series`,      priority: '0.9', changefreq: 'daily'   },
    { loc: `${BASE_URL}/noticias`,    priority: '0.9', changefreq: 'daily'   },
    { loc: `${BASE_URL}/pessoas`,     priority: '0.8', changefreq: 'weekly'  },
    { loc: `${BASE_URL}/sobre`,       priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/privacidade`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/termos`,      priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/contato`,     priority: '0.5', changefreq: 'monthly' },
  ];
  fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), createSitemapXml(pagesUrls));
  staticSitemaps.push({ file: 'sitemap-pages.xml', loc: `${BASE_URL}/sitemap-pages.xml` });
  console.log('✅ sitemap-pages.xml gerado.');

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
    // 2. Movies
    console.log('🎬 Buscando Filmes (20 páginas)...');
    const movies = await fetchTMDBPages('movie/popular', 20);
    const movieUrls = movies.map(m => ({
      loc: `${BASE_URL}/filmes/${m.id}-${slugify(m.title)}`,
      priority: '0.6',
      changefreq: 'weekly',
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-movies.xml'), createSitemapXml(movieUrls));
    staticSitemaps.push({ file: 'sitemap-movies.xml', loc: `${BASE_URL}/sitemap-movies.xml` });
    console.log(`✅ sitemap-movies.xml gerado (${movieUrls.length} links).`);

    // 3. Series
    console.log('📺 Buscando Séries (20 páginas)...');
    const series = await fetchTMDBPages('tv/popular', 20);
    const seriesUrls = series.map(s => ({
      loc: `${BASE_URL}/series/${s.id}-${slugify(s.name)}`,
      priority: '0.6',
      changefreq: 'weekly',
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-series.xml'), createSitemapXml(seriesUrls));
    staticSitemaps.push({ file: 'sitemap-series.xml', loc: `${BASE_URL}/sitemap-series.xml` });
    console.log(`✅ sitemap-series.xml gerado (${seriesUrls.length} links).`);

    // 4. People
    console.log('👤 Buscando Pessoas (10 páginas)...');
    const people = await fetchTMDBPages('person/popular', 10);
    const peopleUrls = people.map(p => ({
      loc: `${BASE_URL}/pessoas/${p.id}-${slugify(p.name)}`,
      priority: '0.5',
      changefreq: 'monthly',
    }));
    fs.writeFileSync(path.join(publicDir, 'sitemap-people.xml'), createSitemapXml(peopleUrls));
    staticSitemaps.push({ file: 'sitemap-people.xml', loc: `${BASE_URL}/sitemap-people.xml` });
    console.log(`✅ sitemap-people.xml gerado (${peopleUrls.length} links).`);
  }

  // 5. Sitemap Index
  // Articles are served by the dynamic Vercel serverless function /api/sitemap-articles
  // which always returns the latest published articles — avoids a stale static snapshot.
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/api/sitemap-articles</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
${staticSitemaps
    .filter(s => s.file !== 'sitemap-pages.xml')
    .map(sm => `  <sitemap>
    <loc>${sm.loc}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`)
    .join('\n')}
</sitemapindex>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), indexXml);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml);
  console.log('✅ sitemap-index.xml e sitemap.xml gerados.');
  console.log('✨ Processo concluído com sucesso!');
}

generateSitemaps();
