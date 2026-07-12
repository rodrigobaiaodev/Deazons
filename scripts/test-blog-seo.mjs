import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const mod = await import('../out/prerender.js');
const handler = mod.default;

const slugs = [
  'netflix-vs-prime-video-vs-disney-plus',
  'melhores-filmes-para-estudar-historia',
  'guia-completo-assinar-netflix-2025'
];

for (const slug of slugs) {
  const req = {
    method: 'GET',
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    url: `/api/prerender?url=/blog/${slug}`
  };
  const res = {
    _status: 200,
    _headers: {},
    setHeader(k, v) { this._headers[k] = v; },
    status(code) { this._status = code; return this; },
    send(body) {
      const titleMatch = body.match(/<title>([^<]+)<\/title>/);
      const canonicalMatch = body.match(/rel="canonical"[^>]*href="([^"]+)"/);
      console.log(`\n=== /blog/${slug} ===`);
      console.log('STATUS:', this._status);
      console.log('TITLE:', titleMatch ? titleMatch[1] : 'NOT FOUND');
      console.log('CANONICAL:', canonicalMatch ? canonicalMatch[1] : 'NOT FOUND');
      console.log('CACHE:', this._headers['Cache-Control']);
    },
    end() { console.log(`=== /blog/${slug} END`, this._status, '==='); }
  };
  await handler(req, res);
}
