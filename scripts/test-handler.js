import handler from '../api/prerender.js';

const req = {
  url: 'https://deazons.com/api/prerender?url=/filmes',
  headers: {
    'user-agent': 'Googlebot'
  }
};

const res = {
  setHeader: (key, val) => console.log(`setHeader(${key}, ${val})`),
  status: (code) => {
    console.log(`status(${code})`);
    return {
      send: (body) => console.log('SEND SUCCESS!')
    };
  }
};

handler(req, res).catch(console.error);
