
import pg from 'pg';

const { Client } = pg;

// Connection string from setup-db.js
const connectionString = 'postgresql://postgres:motainbike10@db.kqmwkigplnmlkcaqtrby.supabase.co:5432/postgres';

const client = new Client({
  connectionString
});

const updates = [
  { name: 'Omelete', newUrl: 'https://www.cinepop.com.br/feed' },
  { name: 'AdoroCinema', newUrl: 'https://www.filmeseries.com.br/feed' },
  { name: 'ScreenRant', newUrl: 'https://variety.com/feed' },
  { name: 'Collider', newUrl: 'https://deadline.com/feed' }
];

async function main() {
  console.log('Iniciando atualização de feeds via pg...');
  try {
    await client.connect();
    
    for (const update of updates) {
      const res = await client.query(
        'UPDATE rss_sources SET url = $1, active = true WHERE name = $2',
        [update.newUrl, update.name]
      );
      
      if (res.rowCount > 0) {
        console.log(`✅ ${update.name} atualizado para ${update.newUrl}`);
      } else {
        // Se não existir, talvez devamos inserir ou apenas ignorar. 
        // O usuário pediu para trocar, então supomos que existam.
        // Se não existir pelo nome exato, tentamos inserir para garantir que os novos funcionem.
        await client.query(
          'INSERT INTO rss_sources (name, url, active) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
          [update.name, update.newUrl]
        );
        console.log(`➕ ${update.name} inserido/garantido com ${update.newUrl}`);
      }
    }
  } catch (err) {
    console.error('Erro na atualização:', err.message);
  } finally {
    await client.end();
    console.log('Processo finalizado.');
  }
}

main();
