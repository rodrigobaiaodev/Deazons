
import pg from 'pg';

const { Client } = pg;

// Connection string from setup-db.js
const connectionString = 'postgresql://postgres:motainbike10@db.kqmwkigplnmlkcaqtrby.supabase.co:5432/postgres';

const client = new Client({
  connectionString
});

const toRemove = ['Omelete', 'ScreenRant', 'AdoroCinema', 'Collider'];

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
  console.log('Iniciando faxina e atualização de feeds...');
  try {
    await client.connect();
    
    // Remover antigos
    for (const name of toRemove) {
      await client.query('DELETE FROM rss_sources WHERE name = $1', [name]);
      console.log(`🗑️ Removido: ${name}`);
    }
    
    // Adicionar novos
    for (const feed of toAdd) {
      await client.query(
        'INSERT INTO rss_sources (name, url, active) VALUES ($1, $2, true) ON CONFLICT (name) DO UPDATE SET url = EXCLUDED.url, active = true',
        [feed.name, feed.url]
      );
      console.log(`✅ Adicionado/Atualizado: ${feed.name}`);
    }

    console.log('Atualização de feeds finalizada com sucesso!');
  } catch (err) {
    console.error('Erro na atualização:', err.message);
  } finally {
    await client.end();
  }
}

main();
