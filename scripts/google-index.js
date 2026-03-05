
/**
 * MODELO PARA INDEXAÇÃO INSTANTÂNEA (GOOGLE INDEXING API)
 * 
 * Este script permite avisar o Google imediatamente quando uma nova notícia é publicada.
 * 
 * Requisitos:
 * 1. Criar um projeto no Google Cloud Console.
 * 2. Ativar a "Indexing API".
 * 3. Criar uma "Conta de Serviço", baixar o JSON de chaves e renomear para 'service-account.json' na raiz.
 * 4. Adicionar o e-mail da conta de serviço como 'Proprietário' no Google Search Console da sua URL.
 * 5. Instalar a biblioteca: npm install googleapis
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const KEY_FILE = path.join(process.cwd(), 'service-account.json');

async function notifyGoogle(url, type = 'URL_UPDATED') {
  if (!fs.existsSync(KEY_FILE)) {
    console.error('❌ Erro: Arquivo service-account.json não encontrado na raiz do projeto.');
    console.info('💡 Siga os passos comentados no topo deste script para configurar sua conta de serviço.');
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const authClient = await auth.getClient();
    const indexing = google.indexing({ version: 'v3', auth: authClient });

    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type, // 'URL_UPDATED' ou 'URL_DELETED'
      },
    });

    console.log(`✅ Sucesso! Google notificado para a URL: ${url}`);
    console.log('Resposta:', res.data);
  } catch (err) {
    console.error('❌ Erro na Indexing API:', err.message);
  }
}

// --- EXEMPLO DE USO ---
// const novaUrl = 'https://deazons.com/noticias/exemplo-de-noticia';
// notifyGoogle(novaUrl);

console.log('🚀 Script de Indexação Instantânea preparado.');
console.log('Para usar, configure o service-account.json e chame a função notifyGoogle(url).');
