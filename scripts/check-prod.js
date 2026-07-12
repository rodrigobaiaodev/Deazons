const url = process.argv[2] || 'https://deazons.com/filmes';
const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const normalUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';
const useBot = process.argv[3] !== 'normal';

fetch(url, {
  headers: {
    'User-Agent': useBot ? ua : normalUA,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
}).then(async r => {
  console.log('UA mode:', useBot ? 'BOT (Googlebot)' : 'NORMAL (browser)');
  console.log('Status:', r.status);
  console.log('x-vercel-cache:', r.headers.get('x-vercel-cache'));
  console.log('x-vercel-id:', r.headers.get('x-vercel-id'));
  console.log('content-type:', r.headers.get('content-type'));
  console.log('---');
  const body = await r.text();
  const titleMatch = body.match(/<title>([^<]*)<\/title>/);
  const canonMatch = body.match(/canonical" href="([^"]*)"/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
  console.log('Canonical:', canonMatch ? canonMatch[1] : 'NOT FOUND');
}).catch(err => console.error('Error:', err));
