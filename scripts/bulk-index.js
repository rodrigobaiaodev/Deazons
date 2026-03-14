
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const KEY_FILE = path.join(process.cwd(), 'service-account.json');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Credenciais Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function notifyGoogle(url, type = 'URL_UPDATED') {
  if (!fs.existsSync(KEY_FILE)) {
    return { success: false, error: 'service-account.json not found' };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const authClient = await auth.getClient();
    const indexing = google.indexing({ version: 'v3', auth: authClient });

    await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type,
      },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Iniciando Notificação em Massa para o Google Indexing API...');

  if (!fs.existsSync(KEY_FILE)) {
    console.warn('⚠️ service-account.json não encontrado. Apenas simulando...');
  }

  const { data: articles, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published');

  if (error || !articles) {
    console.error('Erro ao buscar artigos:', error);
    return;
  }

  console.log(`Encontrados ${articles.length} artigos para indexar.`);

  for (const art of articles) {
    const url = `https://deazons.com/noticias/${art.slug}`;
    console.log(`Notificando: ${url}...`);
    
    if (fs.existsSync(KEY_FILE)) {
        const result = await notifyGoogle(url);
        if (result.success) {
            console.log(`✅ Sucesso!`);
        } else {
            console.log(`❌ Erro: ${result.error}`);
        }
        // Sleep to respect quotas (max 200 per day usually, but let's be safe)
        await new Promise(r => setTimeout(r, 500));
    } else {
        console.log(`📝 [Simulação] Google seria notificado da URL: ${url}`);
    }
  }

  console.log('✨ Processo concluído.');
}

main();
