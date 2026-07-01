import handler from '../api/prerender.js';

async function test(url, expectedTitlePart, expectedCanonical, userAgent = 'Googlebot') {
  console.log(`\nTesting ${url}...`);
  const req = {
    headers: {
      'user-agent': userAgent
    },
    url: url
  };
  
  let statusCode = 200;
  let headers = {};
  let sentBody = '';
  
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, value) {
      headers[name] = value;
      return this;
    },
    send(body) {
      sentBody = body;
      return this;
    },
    end() {
      return this;
    }
  };
  
  try {
    await handler(req, res);
    
    if (statusCode !== 200) {
      throw new Error(`Expected status 200, got ${statusCode}`);
    }
    
    if (!headers['Content-Type'] || !headers['Content-Type'].includes('text/html')) {
      throw new Error(`Expected Content-Type text/html, got ${headers['Content-Type']}`);
    }
    
    const titleMatch = sentBody.match(/<title>([^<]*)<\/title>/);
    const descMatch = sentBody.match(/<meta name="description" content="([^"]*)"/);
    const canonicalMatch = sentBody.match(/<link rel="canonical" href="([^"]*)"/);
    
    const title = titleMatch ? titleMatch[1] : '';
    const desc = descMatch ? descMatch[1] : '';
    const canonical = canonicalMatch ? canonicalMatch[1] : '';
    
    console.log(`  ↳ Status: ${statusCode}`);
    console.log(`  ↳ Title: "${title}"`);
    console.log(`  ↳ Canonical: "${canonical}"`);
    console.log(`  ↳ Description: "${desc.substring(0, 80)}..."`);
    
    if (expectedTitlePart && !title.toLowerCase().includes(expectedTitlePart.toLowerCase())) {
      throw new Error(`Title "${title}" does not contain expected part "${expectedTitlePart}"`);
    }
    
    if (expectedCanonical && canonical !== expectedCanonical) {
      throw new Error(`Canonical "${canonical}" does not match expected "${expectedCanonical}"`);
    }
    
    console.log(`  ✅ PASSED`);
  } catch (error) {
    console.error(`  ❌ FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('🚀 Starting Bot Prerender Tests locally...');
  
  // Home
  await test('/api/prerender?url=/', 'Deazons | Filmes, Séries', 'https://deazons.com/');
  
  // Categories
  await test('/api/prerender?url=/filmes', 'Filmes Populares', 'https://deazons.com/filmes');
  await test('/api/prerender?url=/series', 'Séries Populares', 'https://deazons.com/series');
  await test('/api/prerender?url=/pessoas', 'Famosos, Atores e Atrizes', 'https://deazons.com/pessoas');
  await test('/api/prerender?url=/noticias', 'Notícias de Filmes', 'https://deazons.com/noticias');
  await test('/api/prerender?url=/blog', 'Blog de Cinema', 'https://deazons.com/blog');
  
  // Static Pages
  await test('/api/prerender?url=/sobre', 'Sobre o Deazons', 'https://deazons.com/sobre');
  await test('/api/prerender?url=/privacidade', 'Política de Privacidade', 'https://deazons.com/privacidade');
  
  // Movie details, cast
  console.log('\n--- Testing TMDB cache mechanism ---');
  await test('/api/prerender?url=/filmes/1022789-inside-out-2', 'Divertida Mente 2', 'https://deazons.com/filmes/1022789-inside-out-2');
  console.log('--- Fetching again, should hit cache (look for [Cache Hit]) ---');
  await test('/api/prerender?url=/filmes/1022789-inside-out-2', 'Divertida Mente 2', 'https://deazons.com/filmes/1022789-inside-out-2');
  
  await test('/api/prerender?url=/filmes/1022789-inside-out-2/cast', 'Elenco de Divertida Mente 2', 'https://deazons.com/filmes/1022789-inside-out-2/cast');
  
  // TV details, cast
  await test('/api/prerender?url=/series/94605-arcane', 'Arcane', 'https://deazons.com/series/94605-arcane');
  await test('/api/prerender?url=/series/94605-arcane/cast', 'Elenco de Arcane', 'https://deazons.com/series/94605-arcane/cast');
  
  // Person details, filmography
  await test('/api/prerender?url=/pessoas/1245', 'Scarlett Johansson', 'https://deazons.com/pessoas/1245');
  await test('/api/prerender?url=/pessoas/1245/movie', 'Filmografia de Scarlett Johansson (filmes)', 'https://deazons.com/pessoas/1245/movie');
  
  // Blog posts
  await test('/api/prerender?url=/blog/netflix-vs-prime-video-vs-disney-plus', 'Netflix vs Prime Video', 'https://deazons.com/blog/netflix-vs-prime-video-vs-disney-plus');
  
  if (process.exitCode === 1) {
    console.log('\n🔴 Some tests failed. Please review output.');
  } else {
    console.log('\n🟢 All tests completed successfully!');
  }
}

run();
