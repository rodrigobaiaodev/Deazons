/**
 * api/sitemap-articles.js
 * Dynamic articles sitemap from Supabase (all published rows, real lastmod).
 * Served at /sitemap-articles.xml via vercel.json rewrite.
 */

const PAGE_SIZE = 1000;

async function fetchAllArticles(supabaseUrl, anonKey) {
  const articles = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const apiRes = await fetch(
      `${supabaseUrl}/rest/v1/articles?status=eq.published&select=slug,published_at,created_at&order=published_at.desc`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Range: `${from}-${to}`,
          Prefer: 'count=exact',
        },
      }
    );

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      throw new Error(`Supabase error: ${apiRes.status} - ${errorText}`);
    }

    const batch = await apiRes.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    articles.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return articles;
}

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('sitemap-articles error: Missing Supabase config');
    return res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
    );
  }

  try {
    const articles = await fetchAllArticles(SUPABASE_URL, ANON_KEY);
    const today = new Date().toISOString().split('T')[0];

    const urls = articles
      .filter((a) => a?.slug)
      .map((a) => {
        const lastmod = (a.published_at || a.created_at || today).split('T')[0];
        return `  <url>
    <loc>https://deazons.com/noticias/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return res.status(200).send(xml);
  } catch (err) {
    console.error('sitemap-articles error:', err);
    return res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
    );
  }
}
