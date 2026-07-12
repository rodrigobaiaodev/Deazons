/**
 * Tests a production URL with a cache-busting query param so CDN never hits cache.
 * This confirms whether the new Vercel routing rules are active and working.
 */
const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BASE = 'https://deazons.com';

async function testFresh(path, expectedTitle, expectedCanonical) {
  // Add a unique query param to guarantee CDN cache miss
  const cacheBust = `_nc=${Date.now()}`;
  const url = `${BASE}${path}?${cacheBust}`;
  console.log(`\nFresh test (no CDN cache): ${path}`);
  console.log(`  Full URL: ${url}`);

  const r = await fetch(url, {
    headers: { 'User-Agent': BOT_UA }
  });

  const cacheStatus = r.headers.get('x-vercel-cache') || 'unknown';
  const ct = r.headers.get('content-type') || '';
  const body = await r.text();

  const titleMatch = body.match(/<title>([^<]*)<\/title>/);
  const canonMatch = body.match(/canonical" href="([^"]*)"/);
  const title = titleMatch ? titleMatch[1] : '';
  const canonical = canonMatch ? canonMatch[1] : '';

  console.log(`  x-vercel-cache: ${cacheStatus}`);
  console.log(`  content-type: ${ct}`);
  console.log(`  Title: "${title}"`);
  console.log(`  Canonical: "${canonical}"`);

  const titleOk = title.toLowerCase().includes(expectedTitle.toLowerCase());
  const canonicalOk = canonical === expectedCanonical;

  if (cacheStatus === 'HIT') {
    console.log(`  ⚠️  CDN returned a HIT even with cache-busting query! Vercel may be ignoring query params.`);
  }

  if (titleOk && canonicalOk) {
    console.log(`  ✅ ROUTING WORKS — bot route is intercepting correctly`);
    return true;
  } else {
    console.log(`  ❌ ROUTING FAILED or stale cache persists`);
    if (!titleOk) console.log(`     Expected title to contain: "${expectedTitle}"`);
    if (!canonicalOk) console.log(`     Expected canonical: "${expectedCanonical}", got: "${canonical}"`);
    return false;
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('🔬 ROUTING CONFIRMATION — Cache-busted fresh requests');
  console.log('='.repeat(60));

  const results = await Promise.all([
    testFresh('/filmes', 'Filmes Populares', 'https://deazons.com/filmes'),
    testFresh('/series', 'Séries Populares', 'https://deazons.com/series'),
    testFresh('/blog/netflix-vs-prime-video-vs-disney-plus', 'Netflix vs Prime Video', 'https://deazons.com/blog/netflix-vs-prime-video-vs-disney-plus'),
    testFresh('/sobre', 'Sobre o Deazons', 'https://deazons.com/sobre'),
  ]);

  const allPass = results.every(Boolean);
  console.log('\n' + '='.repeat(60));
  console.log(allPass
    ? '🟢 All fresh routing tests PASSED — new deployment is working!'
    : '🔴 Some routing tests FAILED — investigate or wait for CDN cache to expire');
  console.log('='.repeat(60));
}

run().catch(console.error);
