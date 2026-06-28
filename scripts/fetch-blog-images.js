import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.error('ERROR: PEXELS_API_KEY is not set in environment variables.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We need to read the TS file and extract the data.
// Since it's a TS file, parsing it as JSON won't work directly.
// A simpler approach for this specific script is to duplicate the raw array,
// or we can use regex to extract it. To be safe, we'll just define the queries here
// or compile it on the fly. Let's use a simpler approach: we'll read the TS file,
// find the queries using regex.

const postsFilePath = path.join(__dirname, '../src/blog/data/posts.ts');
const outputFilePath = path.join(__dirname, '../src/blog/data/images.json');

const postsFileContent = fs.readFileSync(postsFilePath, 'utf-8');

// Simple regex to extract slug and searchQuery
const slugRegex = /slug:\s*"([^"]+)"/g;
const queryRegex = /searchQuery:\s*"([^"]+)"/g;

const slugs = [];
const queries = [];

let match;
while ((match = slugRegex.exec(postsFileContent)) !== null) {
  slugs.push(match[1]);
}
while ((match = queryRegex.exec(postsFileContent)) !== null) {
  queries.push(match[1]);
}

if (slugs.length !== queries.length) {
  console.error("Mismatch between slugs and queries found in posts.ts");
  process.exit(1);
}

const posts = slugs.map((slug, index) => ({
  slug,
  searchQuery: queries[index]
}));

console.log(`Found ${posts.length} posts to fetch images for.`);

const fetchPexelsImages = (query) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`API Error for query "${query}": ${res.statusCode}`);
          resolve([]);
          return;
        }
        try {
          const json = JSON.parse(data);
          if (!json.photos || json.photos.length === 0) {
             console.warn(`No photos found for query: ${query}`);
             resolve([]);
             return;
          }
          const images = json.photos.map(photo => ({
            url: photo.src.large,
            alt: photo.alt || query,
            photographer: photo.photographer,
            photographer_url: photo.photographer_url
          }));
          resolve(images);
        } catch (e) {
          console.error('Error parsing JSON:', e);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error('HTTP Error:', err.message);
      resolve([]);
    });
  });
};

// Delay function to avoid hitting rate limits (Pexels allows 200 req/hour for basic)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
  const imagesDb = {};
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i+1}/${posts.length}] Fetching images for: ${post.slug} (Query: ${post.searchQuery})`);
    
    const images = await fetchPexelsImages(post.searchQuery);
    imagesDb[post.slug] = images;
    
    // Wait 500ms between requests to be gentle on the API
    await delay(500);
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(imagesDb, null, 2));
  console.log(`\nSuccess! Images saved to ${outputFilePath}`);
}

main();
