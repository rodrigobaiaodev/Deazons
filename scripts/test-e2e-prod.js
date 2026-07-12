/**
 * E2E final — output completo dos headers e meta tags de produção.
 * Equivalente a vários `curl -sI` e `curl -s | grep`.
 */

const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const NORMAL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';
const BASE = 'https://deazons.com';

function sep(label) {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${label}`);
  console.log('─'.repeat(60));
}

async function get(url, ua, headersOnly = false) {
  const method = headersOnly ? 'HEAD' : 'GET';
  const r = await fetch(url, {
    method,
    headers: { 'User-Agent': ua }
  });
  const relevantHeaders = {
    'x-vercel-cache':   r.headers.get('x-vercel-cache'),
    'cache-control':    r.headers.get('cache-control'),
    'vary':             r.headers.get('vary'),
    'content-type':     r.headers.get('content-type'),
    'x-vercel-id':      r.headers.get('x-vercel-id'),
  };
  const body = headersOnly ? null : await r.text();
  return { status: r.status, headers: relevantHeaders, body };
}

function extractMeta(html) {
  const title    = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '—';
  const canonical= (html.match(/canonical" href="([^"]*)"/) || [])[1] || '—';
  return { title, canonical };
}

async function testSeo(label, path, ua, expectedTitle, expectedCanonical) {
  sep(`TAREFA 2 — SEO | ${label}`);
  const url = `${BASE}${path}`;
  console.log(`URL: ${url}`);
  console.log(`UA:  ${ua === BOT_UA ? 'Googlebot' : 'Chrome normal'}`);
  const { status, headers, body } = await get(url, ua);
  console.log('\nHeaders de resposta:');
  Object.entries(headers).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  const { title, canonical } = extractMeta(body);
  console.log(`\n<title>:     ${title}`);
  console.log(`<canonical>: ${canonical}`);
  const titleOk     = title.toLowerCase().includes(expectedTitle.toLowerCase());
  const canonicalOk = canonical === expectedCanonical;
  console.log(`\nResultado: ${titleOk && canonicalOk ? '✅ PASS' : '❌ FAIL'}`);
  if (!titleOk)     console.log(`  Title esperado contendo: "${expectedTitle}"`);
  if (!canonicalOk) console.log(`  Canonical esperado: "${expectedCanonical}"\n  Canonical obtido:   "${canonical}"`);
  return titleOk && canonicalOk;
}

async function testAsset(label, path) {
  sep(`TAREFA 3 — ASSET | ${label}`);
  const url = `${BASE}${path}`;
  console.log(`URL: ${url}`);
  console.log(`UA:  Googlebot`);
  const { status, headers } = await get(url, BOT_UA, true);
  console.log(`\nHTTP status: ${status}`);
  console.log('Headers de resposta:');
  Object.entries(headers).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  const ct = headers['content-type'] || '';
  const isHtml = ct.includes('text/html');
  console.log(`\nResultado: ${!isHtml && status === 200 ? '✅ PASS' : '❌ FAIL'}`);
  if (isHtml) console.log('  PROBLEMA: retornou text/html em vez do tipo correto do asset');
  return !isHtml && status === 200;
}

async function testNormal(label, path) {
  sep(`TAREFA 4 — NORMAL UA | ${label}`);
  const url = `${BASE}${path}`;
  console.log(`URL: ${url}`);
  console.log(`UA:  Chrome normal`);
  const { status, headers, body } = await get(url, NORMAL_UA);
  console.log(`\nHTTP status: ${status}`);
  console.log('Headers de resposta:');
  Object.entries(headers).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  const hasSpaRoot = body.includes('id="root"');
  const { title, canonical } = extractMeta(body);
  console.log(`\nid="root" presente: ${hasSpaRoot}`);
  console.log(`<title>:     ${title}`);
  console.log(`<canonical>: ${canonical}`);
  console.log(`\nResultado: ${hasSpaRoot ? '✅ PASS (recebeu SPA shell)' : '❌ FAIL (não recebeu SPA shell)'}`);
  return hasSpaRoot;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  let pass = 0, fail = 0;
  const record = (ok) => ok ? pass++ : fail++;

  console.log('═'.repeat(60));
  console.log('  E2E PRODUÇÃO — deazons.com   ' + new Date().toISOString());
  console.log('═'.repeat(60));

  record(await testSeo('/              (Home)',           '/',                                               BOT_UA, 'Deazons | Filmes',    'https://deazons.com/'));
  record(await testSeo('/filmes        (listagem)',       '/filmes',                                         BOT_UA, 'Filmes Populares',    'https://deazons.com/filmes'));
  record(await testSeo('/series        (listagem)',       '/series',                                         BOT_UA, 'Séries Populares',    'https://deazons.com/series'));
  record(await testSeo('/filmes/:id    (detalhe filme)',  '/filmes/1022789-inside-out-2',                    BOT_UA, 'Divertida Mente 2',   'https://deazons.com/filmes/1022789-inside-out-2'));
  record(await testSeo('/blog/:slug    (post blog)',      '/blog/netflix-vs-prime-video-vs-disney-plus',     BOT_UA, 'Netflix vs',          'https://deazons.com/blog/netflix-vs-prime-video-vs-disney-plus'));

  record(await testAsset('favicon.ico',          '/favicon.ico'));
  record(await testAsset('favicon.png',          '/favicon.png'));
  record(await testAsset('robots.txt',           '/robots.txt'));
  record(await testAsset('sitemap.xml',          '/sitemap.xml'));
  record(await testAsset('sitemap-index.xml',    '/sitemap-index.xml'));
  record(await testAsset('placeholder.svg',      '/placeholder.svg'));
  record(await testAsset('deazons-logo.png',     '/deazons-logo.png'));
  record(await testAsset('assets JS chunk',      '/assets/index-CMPKcIxQ.js'));
  record(await testAsset('assets CSS',           '/assets/index-4gz-nz6Q.css'));

  record(await testNormal('/filmes (browser)',   '/filmes'));
  record(await testNormal('/filmes/:id (browser)', '/filmes/1022789-inside-out-2'));

  sep('RESULTADO FINAL');
  const total = pass + fail;
  if (fail === 0) {
    console.log(`🟢 TODOS OS TESTES PASSARAM: ${pass}/${total}`);
  } else {
    console.log(`🔴 FALHAS: ${fail}/${total}`);
  }
  console.log('═'.repeat(60) + '\n');
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });

