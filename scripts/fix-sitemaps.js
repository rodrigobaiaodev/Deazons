/**
 * fix-sitemaps.js
 * Corrige e otimiza todos os sitemaps do Deazons seguindo as melhores práticas
 * do Yoast SEO e Rank Math para indexação rápida pelo Google.
 *
 * Correções aplicadas:
 * 1. Remove URLs inválidas (slug vazio, apenas "--", apenas "-")
 * 2. Adiciona <lastmod> com data atual
 * 3. Adiciona <changefreq> adequado por tipo de conteúdo
 * 4. Atualiza <priority> diferenciada
 * 5. Corrige o sitemap-index.xml com datas atualizadas
 * 6. Corrige sitemap.xml para redirecionar ao índice
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidUrl(loc) {
  // Remove URLs com slug inválido: termina em "/-", "/--", ou apenas "/ID-"
  if (/\/\d+-?$/.test(loc)) return false;       // termina em /123- ou /123
  if (/\/-{1,3}$/.test(loc)) return false;       // termina em /- ou /--
  if (/\/\d+--/.test(loc)) return false;         // contém 123--texto
  // slug deve ter pelo menos uma letra após o ID
  const slugPart = loc.split('/').pop();
  if (!slugPart || !/^[\d]+-\w/.test(slugPart)) return false;
  return true;
}

function buildUrl({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function parseUrlsFromXml(xml) {
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  return urlBlocks.map(block => {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);
    const priorityMatch = block.match(/<priority>(.*?)<\/priority>/);
    return {
      loc: locMatch ? locMatch[1].trim() : null,
      lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
      priority: priorityMatch ? priorityMatch[1].trim() : null,
    };
  }).filter(u => u.loc);
}

// ─── Processar sitemap-movies.xml ───────────────────────────────────────────

function fixMoviesSitemap() {
  const xml = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap-movies.xml'), 'utf8');
  const urls = parseUrlsFromXml(xml);

  const validUrls = urls.filter(u => isValidUrl(u.loc));
  const removed = urls.length - validUrls.length;
  console.log(`[filmes] Total: ${urls.length} | Removidas (inválidas): ${removed} | Válidas: ${validUrls.length}`);

  const urlsXml = validUrls.map(u => buildUrl({
    loc: u.loc,
    lastmod: TODAY,
    changefreq: 'weekly',
    priority: '0.7',
  })).join('\n');

  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-movies.xml'), output, 'utf8');
  console.log(`[filmes] ✅ sitemap-movies.xml corrigido com ${validUrls.length} URLs`);
  return validUrls.length;
}

// ─── Processar sitemap-series.xml ───────────────────────────────────────────

function fixSeriesSitemap() {
  const xml = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap-series.xml'), 'utf8');
  const urls = parseUrlsFromXml(xml);

  const validUrls = urls.filter(u => isValidUrl(u.loc));
  const removed = urls.length - validUrls.length;
  console.log(`[series] Total: ${urls.length} | Removidas (inválidas): ${removed} | Válidas: ${validUrls.length}`);

  const urlsXml = validUrls.map(u => buildUrl({
    loc: u.loc,
    lastmod: TODAY,
    changefreq: 'weekly',
    priority: '0.7',
  })).join('\n');

  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-series.xml'), output, 'utf8');
  console.log(`[series] ✅ sitemap-series.xml corrigido com ${validUrls.length} URLs`);
  return validUrls.length;
}

// ─── Processar sitemap-people.xml ───────────────────────────────────────────

function fixPeopleSitemap() {
  const xml = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap-people.xml'), 'utf8');
  const urls = parseUrlsFromXml(xml);

  // pessoas usam /pessoas/ID sem slug, então validar diferente
  const validUrls = urls.filter(u => {
    const loc = u.loc;
    if (!loc) return false;
    // URL de pessoa: /pessoas/123 ou /pessoas/123-nome — ambos válidos
    if (/\/pessoas\/\d+/.test(loc)) return true;
    return false;
  });

  const removed = urls.length - validUrls.length;
  console.log(`[pessoas] Total: ${urls.length} | Removidas: ${removed} | Válidas: ${validUrls.length}`);

  const urlsXml = validUrls.map(u => buildUrl({
    loc: u.loc,
    lastmod: TODAY,
    changefreq: 'monthly',
    priority: '0.5',
  })).join('\n');

  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-people.xml'), output, 'utf8');
  console.log(`[pessoas] ✅ sitemap-people.xml corrigido com ${validUrls.length} URLs`);
  return validUrls.length;
}

// ─── Processar sitemap-articles.xml ─────────────────────────────────────────

function fixArticlesSitemap() {
  const xml = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap-articles.xml'), 'utf8');
  const urls = parseUrlsFromXml(xml);

  const urlsXml = urls.map(u => buildUrl({
    loc: u.loc,
    lastmod: u.lastmod || TODAY,
    changefreq: 'monthly',
    priority: '0.9',
  })).join('\n');

  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-articles.xml'), output, 'utf8');
  console.log(`[artigos] ✅ sitemap-articles.xml corrigido com ${urls.length} URLs (priority 0.9)`);
  return urls.length;
}

// ─── Processar sitemap-pages.xml ────────────────────────────────────────────

function fixPagesSitemap() {
  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://deazons.com/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://deazons.com/filmes</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://deazons.com/series</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://deazons.com/noticias</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://deazons.com/pessoas</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://deazons.com/sobre</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://deazons.com/privacidade</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://deazons.com/termos</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://deazons.com/contato</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-pages.xml'), output, 'utf8');
  console.log(`[páginas] ✅ sitemap-pages.xml corrigido com 9 URLs`);
  return 9;
}

// ─── Atualizar sitemap-index.xml ─────────────────────────────────────────────

function fixSitemapIndex() {
  const output = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://deazons.com/sitemap-pages.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://deazons.com/sitemap-articles.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://deazons.com/sitemap-movies.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://deazons.com/sitemap-series.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://deazons.com/sitemap-people.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-index.xml'), output, 'utf8');
  // sitemap.xml deve ser idêntico ao índice (Google aceita ambos)
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), output, 'utf8');
  console.log(`[index] ✅ sitemap-index.xml e sitemap.xml atualizados com data ${TODAY}`);
}

// ─── Atualizar robots.txt ─────────────────────────────────────────────────────

function fixRobotsTxt() {
  const output = `User-agent: *
Allow: /

# Não indexar rotas sem valor de SEO
Disallow: /pesquisa
Disallow: /admin/
Disallow: /api/

# Sitemaps
Sitemap: https://deazons.com/sitemap.xml
Sitemap: https://deazons.com/sitemap-index.xml
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), output, 'utf8');
  console.log(`[robots] ✅ robots.txt atualizado`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log(`\n🔧 Corrigindo sitemaps — Data de hoje: ${TODAY}\n`);

const moviesCount  = fixMoviesSitemap();
const seriesCount  = fixSeriesSitemap();
const peopleCount  = fixPeopleSitemap();
const articlesCount = fixArticlesSitemap();
const pagesCount   = fixPagesSitemap();
fixSitemapIndex();
fixRobotsTxt();

const total = moviesCount + seriesCount + peopleCount + articlesCount + pagesCount;
console.log(`\n✅ Concluído! Total de URLs válidas no sitemap: ${total}`);
console.log(`\n📋 Próximos passos:`);
console.log(`   1. Faça commit e push para o GitHub`);
console.log(`   2. Aguarde o deploy na Vercel`);
console.log(`   3. No Google Search Console:`);
console.log(`      → Adicione/atualize: https://deazons.com/sitemap.xml`);
console.log(`      → Adicione/atualize: https://deazons.com/sitemap-index.xml`);
console.log(`      → Solicite indexação manual da homepage e páginas principais`);
console.log(`   4. Use "Inspecionar URL" no GSC para forçar re-crawl das páginas`);
