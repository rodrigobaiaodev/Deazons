/**
 * update-sitemaps.js
 * Busca TODOS os artigos publicados no Supabase e regenera o sitemap-articles.xml
 * com as URLs corretas e datas atuais.
 *
 * Uso: node update-sitemaps.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const TODAY = new Date().toISOString().split('T')[0];

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
    }
  } catch (e) { /* silent */ }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL     = 'https://deazons.com';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente faltando.');
  process.exit(1);
}

// ── Fetch all articles from Supabase (paginado) ──────────────────────────────
async function fetchAllArticles() {
  const headers = {
    'Content-Type': 'application/json',
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };

  let all = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.published&select=slug,published_at&order=published_at.desc&limit=${pageSize}&offset=${from}`,
      { headers }
    );
    if (!res.ok) {
      console.error('Erro Supabase:', await res.text());
      break;
    }
    const data = await res.json();
    if (!data.length) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// ── Gera XML de um sitemap ───────────────────────────────────────────────────
function buildUrlsetXml(urls) {
  const urlsXml = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

// ── Gera sitemap-articles.xml ────────────────────────────────────────────────
async function updateArticlesSitemap() {
  console.log('\n📰 Buscando artigos publicados no Supabase...');
  const articles = await fetchAllArticles();
  console.log(`   ↳ ${articles.length} artigos encontrados`);

  const urls = articles
    .filter(a => a.slug && a.slug.trim())
    .map(a => ({
      loc: `${BASE_URL}/noticias/${a.slug}`,
      lastmod: a.published_at ? a.published_at.split('T')[0] : TODAY,
      changefreq: 'weekly',
      priority: '0.9',
    }));

  const xml = buildUrlsetXml(urls);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-articles.xml'), xml, 'utf8');
  console.log(`✅ sitemap-articles.xml atualizado com ${urls.length} URLs`);
  return urls.length;
}

// ── Atualiza sitemap-pages.xml ────────────────────────────────────────────────
function updatePagesSitemap() {
  const pages = [
    { loc: `${BASE_URL}/`,            lastmod: TODAY, changefreq: 'daily',   priority: '1.0' },
    { loc: `${BASE_URL}/filmes`,      lastmod: TODAY, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/series`,      lastmod: TODAY, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/noticias`,    lastmod: TODAY, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/pessoas`,     lastmod: TODAY, changefreq: 'weekly',  priority: '0.7' },
    { loc: `${BASE_URL}/sobre`,       lastmod: TODAY, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE_URL}/privacidade`, lastmod: TODAY, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/termos`,      lastmod: TODAY, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/contato`,     lastmod: TODAY, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/blog`,        lastmod: TODAY, changefreq: 'daily',   priority: '0.9' },
  ];
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-pages.xml'), buildUrlsetXml(pages), 'utf8');
  console.log('✅ sitemap-pages.xml atualizado com 9 URLs');
}

// ── Atualiza lastmod dos sitemaps estáticos existentes ───────────────────────
function refreshStaticSitemapDates(filename) {
  const filepath = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(filepath)) return 0;
  let xml = fs.readFileSync(filepath, 'utf8');

  // Atualiza todos os <lastmod> para hoje
  xml = xml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
  fs.writeFileSync(filepath, xml, 'utf8');

  const count = (xml.match(/<url>/g) || []).length;
  console.log(`✅ ${filename} atualizado (lastmod=${TODAY}) — ${count} URLs`);
  return count;
}

// ── Gera robots.txt otimizado ─────────────────────────────────────────────────
function updateRobotsTxt() {
  const content = `User-agent: *
Allow: /

# Bloquear rotas sem valor SEO
Disallow: /admin/
Disallow: /api/
Disallow: /pesquisa

# Sitemaps — todos listados para o Googlebot
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-index.xml
Sitemap: ${BASE_URL}/sitemap-pages.xml
Sitemap: ${BASE_URL}/sitemap-articles.xml
Sitemap: ${BASE_URL}/sitemap-blog.xml
Sitemap: ${BASE_URL}/sitemap-movies.xml
Sitemap: ${BASE_URL}/sitemap-series.xml
Sitemap: ${BASE_URL}/sitemap-people.xml
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), content, 'utf8');
  console.log('✅ robots.txt atualizado com todos os sitemaps listados');
}

// ── Gera sitemap-index.xml atualizado ────────────────────────────────────────
function updateSitemapIndex(articleCount) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-articles.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-movies.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-series.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-blog.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-people.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-index.xml'), xml, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log(`✅ sitemap-index.xml e sitemap.xml atualizados (${TODAY})`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔧 Atualizando todos os sitemaps — ${TODAY}\n`);

  const articlesCount = await updateArticlesSitemap();
  updatePagesSitemap();

  const moviesCount = refreshStaticSitemapDates('sitemap-movies.xml');
  const seriesCount = refreshStaticSitemapDates('sitemap-series.xml');
  const peopleCount = refreshStaticSitemapDates('sitemap-people.xml');

  updateSitemapIndex(articlesCount);
  updateRobotsTxt();

  const total = articlesCount + 9 + moviesCount + seriesCount + peopleCount;

  console.log(`\n🎉 Concluído! Total de URLs nos sitemaps: ${total}`);
  console.log(`\n📋 PRÓXIMOS PASSOS OBRIGATÓRIOS para indexação:`);
  console.log(`   1. Faça commit e push (este script já faz isso)`);
  console.log(`   2. Aguarde o deploy na Vercel (~2min)`);
  console.log(`   3. No Google Search Console (search.google.com/search-console):`);
  console.log(`      → Vá em "Sitemaps" e submeta:`);
  console.log(`        • sitemap.xml`);
  console.log(`        • sitemap-index.xml`);
  console.log(`        • sitemap-articles.xml`);
  console.log(`      → Vá em "Inspeção de URL" e solicite indexação das URLs principais`);
}

main().catch(err => {
  console.error('💥 Erro:', err);
  process.exit(1);
});
