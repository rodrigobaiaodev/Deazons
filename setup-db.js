import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:motainbike10@db.kqmwkigplnmlkcaqtrby.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();

  const query = `
    CREATE TABLE IF NOT EXISTS rss_sources (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      url text NOT NULL,
      active boolean DEFAULT true,
      last_fetched timestamp,
      created_at timestamp DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS articles (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      slug text UNIQUE NOT NULL,
      content text NOT NULL,
      meta_description text,
      status text DEFAULT 'draft',
      image_url text,
      image_alt text,
      tags text[],
      category text,
      source_url text UNIQUE,
      created_at timestamp DEFAULT now(),
      published_at timestamp
    );
  `;

  try {
    await client.query(query);
    console.log('Tables created successfully!');
    
    // Insert default feeds if not exists
    const feeds = [
      ['CinePOP', 'https://cinepop.com.br/feed'],
      ['Omelete', 'https://www.omelete.com.br/feed/rss'],
      ['ScreenRant', 'https://screenrant.com/feed/movies'],
      ['Collider', 'https://collider.com/feed'],
      ['AdoroCinema', 'https://www.adorocinema.com/rss/']
    ];
    
    for (const [name, url] of feeds) {
      await client.query(
        'INSERT INTO rss_sources (name, url) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [name, url]
      );
    }
    console.log('Default RSS sources inserted.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await client.end();
  }
}

main();
