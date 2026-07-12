async function test() {
  const r = await fetch('https://deazons.com/filmes', { headers: { 'User-Agent': 'Googlebot' } });
  console.log('Status:', r.status);
  console.log('cache-control:', r.headers.get('cache-control'));
  console.log('x-vercel-cache:', r.headers.get('x-vercel-cache'));
  const text = await r.text();
  console.log('is Prerender:', !text.includes('id="root"'));
}
test();
