import pg from 'pg';

const { Client } = pg;
const connectionString = 'postgresql://postgres:motainbike10@db.kqmwkigplnmlkcaqtrby.supabase.co:5432/postgres';

const client = new Client({ connectionString });

const toAdd = [
  { name: 'ComingSoon', url: 'https://www.comingsoon.net/news/rss-main-30.php' },
  { name: 'CinemaBlend', url: 'https://feeds.feedburner.com/cinemablendallthing' },
  { name: 'RogerEbert', url: 'https://rogerebert.com/feed' },
  { name: 'Hollywood Rep.', url: 'https://www.hollywoodreporter.com/c/movies/feed' },
  { name: 'FirstShowing', url: 'https://www.firstshowing.net/feed' },
  { name: 'MovieWeb', url: 'https://movieweb.com/feed' },
  { name: 'Deadline', url: 'https://deadline.com/feed' },
  { name: 'Variety', url: 'https://variety.com/feed' }
];

async function main() {
  console.log('Adicionando feeds...');
  try {
    await client.connect();
    
    // Pegar feeds existentes
    const res = await client.query('SELECT name, url FROM rss_sources');
    const existingUrls = new Set(res.rows.map(r => r.url));
    
    for (const feed of toAdd) {
      if (!existingUrls.has(feed.url)) {
        await client.query(
          'INSERT INTO rss_sources (name, url, active) VALUES ($1, $2, true)',
          [feed.name, feed.url]
        );
        console.log(`✅ Adicionado: ${feed.name}`);
      } else {
        console.log(`ℹ️ Já existe: ${feed.name}`);
      }
    }
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

main();
