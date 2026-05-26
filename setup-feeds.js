import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const loadEnv = () => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch (e) {
    console.error('Erro ao ler .env.local:', e.message);
  }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
    console.log("Fetching existing sources...");
    const { data: existing, error } = await supabase.from('rss_sources').select('*');
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    console.log("Existing:", existing.map(s => s.url));

    const newFeeds = [
        { name: 'Jornada Geek', url: 'https://jornadageek.ig.com.br/feed/', active: true },
        { name: 'Blog de Hollywood', url: 'https://www.blogdehollywood.com.br/feed', active: true },
        { name: 'Series em Cena', url: 'https://seriesemcena.com.br/feed/', active: true }
    ];

    for (const feed of newFeeds) {
        if (!existing.some(s => s.url === feed.url)) {
            console.log(`Inserting ${feed.name}...`);
            const { error: insErr } = await supabase.from('rss_sources').insert([feed]);
            if (insErr) {
                console.error("Insert error for", feed.name, insErr);
            } else {
                console.log(`Successfully inserted ${feed.name}`);
            }
        } else {
            console.log(`${feed.name} already exists.`);
        }
    }
}
run();
