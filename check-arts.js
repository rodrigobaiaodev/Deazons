import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('.env.local', 'utf8');
content.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) process.env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const feedsRes = await fetch(`${url}/rest/v1/rss_sources?select=*`, {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  console.log("FEEDS:", await feedsRes.json());

  const artsRes = await fetch(`${url}/rest/v1/articles?order=published_at.desc&limit=3&select=title,slug,source_url,content`, {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const arts = await artsRes.json();
  console.log("ARTICLES:");
  arts.forEach(a => {
    console.log(`- ${a.title} (${a.source_url})`);
    console.log(`  Content snippet: ${a.content.substring(0, 200)}...`);
  });
}
check();
