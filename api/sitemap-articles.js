/**
 * api/sitemap-articles.js
 * Gera o sitemap de artigos DINAMICAMENTE a partir do Supabase.
 * O Googlebot pode cachear, mas sempre terá os artigos mais recentes.
 *
 * URL: https://deazons.com/api/sitemap-articles
 * Retorna: XML com todos os artigos publicados + data real de publicação
 */

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('sitemap-articles error: Missing Supabase config');
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }

  try {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.published&select=slug,published_at,created_at&order=published_at.desc`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        }
      }
    );

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error(`Supabase error: ${apiRes.status} - ${errorText}`);
      throw new Error(`Supabase error: ${apiRes.status}`);
    }

    const articles = await apiRes.json();
    const today = new Date().toISOString().split('T')[0];

    const urls = articles.map(a => {
      const lastmod = (a.published_at || a.created_at || today).split('T')[0];
      return `  <url>
    <loc>https://deazons.com/noticias/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return res.status(200).send(xml);

  } catch (err) {
    console.error('sitemap-articles error:', err);
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
}
