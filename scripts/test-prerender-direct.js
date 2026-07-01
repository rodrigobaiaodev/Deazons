import handler from '../api/prerender.js';

async function test(url, userAgent = 'Googlebot') {
  console.log(`\n--- Testing ${url} (User-Agent: ${userAgent}) ---`);
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
    console.log(`Response Status: ${statusCode}`);
    console.log(`Response Headers:`, headers);
    if (statusCode === 200 && sentBody) {
      const titleMatch = sentBody.match(/<title>([^<]*)<\/title>/);
      const descMatch = sentBody.match(/<meta name="description" content="([^"]*)"/);
      const canonicalMatch = sentBody.match(/<link rel="canonical" href="([^"]*)"/);
      
      console.log(`Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`);
      console.log(`Description: ${descMatch ? descMatch[1] : 'NOT FOUND'}`);
      console.log(`Canonical: ${canonicalMatch ? canonicalMatch[1] : 'NOT FOUND'}`);
    } else {
      console.log(`No HTML body (status ${statusCode})`);
    }
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
  }
}

async function run() {
  // Test passing query param /api/prerender?url=... like vercel.json does
  await test('/api/prerender?url=/filmes/1022789-inside-out-2');
  await test('/api/prerender?url=/series/94605-arcane');
  await test('/api/prerender?url=/pessoas/1245');
  await test('/api/prerender?url=/filmes');
}

run();
