/**
 * One-off: regenerate public/sitemap-articles.xml from Supabase.
 * Usage: node scripts/regen-articles-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  const envPath = path.join(root, '.env.local');
  const map = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0) map[line.slice(0, i)] = line.slice(i + 1);
  }
  return map;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const all = [];
let from = 0;
while (true) {
  const res = await fetch(
    `${url}/rest/v1/articles?status=eq.published&select=slug,published_at,created_at&order=published_at.desc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${from}-${from + 999}`,
      },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const batch = await res.json();
  if (!batch.length) break;
  all.push(...batch);
  if (batch.length < 1000) break;
  from += 1000;
}

const today = new Date().toISOString().slice(0, 10);
const urls = all
  .filter((a) => a.slug)
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
</urlset>
`;

fs.writeFileSync(path.join(root, 'public', 'sitemap-articles.xml'), xml);
console.log(`Wrote ${all.length} article URLs`);
