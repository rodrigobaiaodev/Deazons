/**
 * Vercel Serverless Function — Bot Prerender
 * 
 * Detects Googlebot/crawlers and returns HTML enriquecido com meta tags
 * extraídas do Supabase (para artigos) ou TMDB (para filmes/séries).
 * 
 * Esta função é chamada pelo vercel.json para rotas específicas.
 */

import { blogPosts } from '../src/blog/data/posts.ts';
import imagesData from '../src/blog/data/images.json' with { type: 'json' };

const BOT_REGEX = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot/i;

// Cache in-memory para chamadas TMDB
const tmdbCache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas em milissegundos
const MAX_CACHE_SIZE = 1000; // Limite de entradas para evitar leak de memória

async function fetchWithCache(url, cacheKey) {
  const now = Date.now();
  if (tmdbCache.has(cacheKey)) {
    const cached = tmdbCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Cache Hit] key: ${cacheKey}`);
      return cached.data;
    }
    console.log(`[Cache Expired] key: ${cacheKey}`);
    tmdbCache.delete(cacheKey);
  }

  // Evicção se o cache ultrapassar o limite máximo
  if (tmdbCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = tmdbCache.keys().next().value;
    tmdbCache.delete(oldestKey);
    console.log(`[Cache Evict] Evicted oldest key: ${oldestKey}`);
  }

  console.log(`[Cache Miss] Fetching fresh data for: ${cacheKey}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB responded with status ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  tmdbCache.set(cacheKey, {
    timestamp: now,
    data
  });
  return data;
}

function isBot(userAgent = '') {
  return BOT_REGEX.test(userAgent);
}

function buildHTML({ title, description, imageUrl, canonicalUrl, jsonLd, bodyContent }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${imageUrl || 'https://deazons.com/og-default.jpg'}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Deazons" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl || 'https://deazons.com/og-default.jpg'}" />
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const parsedUrl = new URL(req.url, 'https://deazons.com');
  
  // URL can come from ?url= parameter (due to Vercel rewrite) or directly from req.url
  let urlPath = parsedUrl.searchParams.get('url') || req.url || '/';
  
  // Strip query parameters and hashes, and trailing slashes for easier routing matches
  urlPath = urlPath.split('?')[0].split('#')[0];
  if (urlPath.endsWith('/') && urlPath.length > 1) {
    urlPath = urlPath.slice(0, -1);
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const TMDB_KEY = process.env.VITE_TMDB_API_KEY || '6ea976a00b674fb5087f7e37ff72f45c';

  try {
    // ── 1. HOME PAGE ──────────────────────────────────────────────────────────
    if (urlPath === '/' || urlPath === '/index.html' || urlPath === '') {
      const title = 'Deazons | Filmes, Séries e Notícias de Entretenimento';
      const description = 'Descubra informações sobre milhares de filmes, séries e atores no Deazons - seu portal completo de entretenimento com notícias, trailers e onde assistir.';
      const canonicalUrl = 'https://deazons.com/';
      const html = buildHTML({
        title,
        description,
        canonicalUrl,
        bodyContent: `
          <h1>Deazons</h1>
          <p>${description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    // ── 2. CATEGORY LIST PAGES ───────────────────────────────────────────────
    if (urlPath === '/filmes') {
      const title = 'Filmes Populares | Deazons';
      const description = 'Explore nossa coleção de filmes populares no Deazons. Encontre trailers, elenco, onde assistir e muito mais.';
      const canonicalUrl = 'https://deazons.com/filmes';
      const html = buildHTML({
        title,
        description,
        canonicalUrl,
        bodyContent: `
          <h1>${title}</h1>
          <p>${description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    if (urlPath === '/series') {
      const title = 'Séries Populares | Deazons';
      const description = 'Explore nossa coleção de séries populares no Deazons. Encontre trailers, elenco, onde assistir e muito mais.';
      const canonicalUrl = 'https://deazons.com/series';
      const html = buildHTML({
        title,
        description,
        canonicalUrl,
        bodyContent: `
          <h1>${title}</h1>
          <p>${description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    if (urlPath === '/pessoas') {
      const title = 'Famosos, Atores e Atrizes | Deazons';
      const description = 'Conheça os atores, atrizes e cineastas mais populares do momento. Veja biografias, fotos e filmografias no Deazons.';
      const canonicalUrl = 'https://deazons.com/pessoas';
      const html = buildHTML({
        title,
        description,
        canonicalUrl,
        bodyContent: `
          <h1>${title}</h1>
          <p>${description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    if (urlPath === '/noticias') {
      const title = 'Notícias de Filmes, Séries e Cinema | Deazons';
      const description = 'Acompanhe as últimas notícias, novidades, rumores e lançamentos do mundo do cinema, séries de TV e streaming no Deazons.';
      const canonicalUrl = 'https://deazons.com/noticias';
      const html = buildHTML({
        title,
        description,
        canonicalUrl,
        bodyContent: `
          <h1>${title}</h1>
          <p>${description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    if (urlPath === '/blog') {
      const title = 'Blog de Cinema e Entretenimento | Deazons';
      const description = 'Artigos, análises, listas e curiosidades sobre o mundo do cinema, séries de TV e streaming no Blog do Deazons.';
      const canonicalUrl = 'https://deazons.com/blog';
      const html = buildHTML({
        title,
        description,
        canonicalUrl,
        bodyContent: `
          <h1>${title}</h1>
          <p>${description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    // ── 3. STATIC INSTITUTIONAL PAGES ───────────────────────────────────────
    const staticPages = {
      '/sobre': {
        title: 'Sobre o Deazons | Filmes, Séries e Entretenimento',
        description: 'Saiba mais sobre o Deazons, nossa missão e como trazemos as melhores informações sobre cinema e entretenimento para você.'
      },
      '/privacidade': {
        title: 'Política de Privacidade | Deazons',
        description: 'Leia a Política de Privacidade do Deazons. Saiba como coletamos, usamos e protegemos seus dados pessoais.'
      },
      '/termos': {
        title: 'Termos de Serviço | Deazons',
        description: 'Leia os Termos de Serviço do Deazons. Condições de uso, políticas do site e diretrizes de utilização da nossa plataforma.'
      },
      '/contato': {
        title: 'Contato | Deazons',
        description: 'Entre em contato com a equipe do Deazons para parcerias, sugestões, dúvidas ou feedback.'
      }
    };

    if (staticPages[urlPath]) {
      const info = staticPages[urlPath];
      const html = buildHTML({
        title: info.title,
        description: info.description,
        canonicalUrl: `https://deazons.com${urlPath}`,
        bodyContent: `
          <h1>${info.title}</h1>
          <p>${info.description}</p>
        `
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    // ── 4. MOVIE DETAILS AND CAST PAGES ──────────────────────────────────────
    const movieMatch = urlPath.match(/^\/filmes\/(\d+)-?([^/]*)/);
    if (movieMatch) {
      const movieId = movieMatch[1];
      const movieSlug = movieMatch[2] || '';
      const isCastPage = urlPath.endsWith('/cast');
      
      const cacheKey = `movie-${movieId}`;
      try {
        const movie = await fetchWithCache(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}&language=pt-BR`,
          cacheKey
        );
        
        if (movie && movie.title) {
          const canonicalUrl = `https://deazons.com/filmes/${movieId}-${movieSlug}${isCastPage ? '/cast' : ''}`;
          const imageUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null;
          const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
          
          let title = `${movie.title}${year ? ` (${year})` : ''} | Deazons`;
          let description = movie.overview ? movie.overview.substring(0, 160) + '...' : `Veja detalhes, elenco e onde assistir ao filme ${movie.title} no Deazons.`;
          
          if (isCastPage) {
            title = `Elenco de ${movie.title}${year ? ` (${year})` : ''} | Deazons`;
            description = `Veja todo o elenco, atores, atrizes, diretores e equipe técnica do filme ${movie.title} no Deazons.`;
          }

          const jsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": isCastPage ? "WebPage" : "Movie",
            "name": movie.title,
            "description": description,
            "image": imageUrl,
            "datePublished": movie.release_date,
            "genre": (movie.genres || []).map(g => g.name)
          });

          const html = buildHTML({
            title,
            description,
            imageUrl,
            canonicalUrl,
            jsonLd,
            bodyContent: `
              <article>
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(description)}</p>
                ${movie.genres ? `<p><strong>Gêneros:</strong> ${movie.genres.map(g => escapeHtml(g.name)).join(', ')}</p>` : ''}
                <p><a href="${canonicalUrl}">Ver no Deazons</a></p>
              </article>
            `
          });

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
          return res.status(200).send(html);
        }
      } catch (err) {
        console.error(`Error fetching movie ${movieId}:`, err);
      }
    }

    // ── 5. TV SHOW DETAILS AND CAST PAGES ────────────────────────────────────
    const seriesMatch = urlPath.match(/^\/series\/(\d+)-?([^/]*)/);
    if (seriesMatch) {
      const tvId = seriesMatch[1];
      const tvSlug = seriesMatch[2] || '';
      const isCastPage = urlPath.endsWith('/cast');
      
      const cacheKey = `tv-${tvId}`;
      try {
        const tv = await fetchWithCache(
          `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_KEY}&language=pt-BR`,
          cacheKey
        );
        
        if (tv && tv.name) {
          const canonicalUrl = `https://deazons.com/series/${tvId}-${tvSlug}${isCastPage ? '/cast' : ''}`;
          const imageUrl = tv.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}` : null;
          const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : '';
          
          let title = `${tv.name}${year ? ` (${year})` : ''} | Deazons`;
          let description = tv.overview ? tv.overview.substring(0, 160) + '...' : `Veja detalhes, elenco e onde assistir à série ${tv.name} no Deazons.`;
          
          if (isCastPage) {
            title = `Elenco de ${tv.name}${year ? ` (${year})` : ''} | Deazons`;
            description = `Veja todo o elenco, atores, atrizes, diretores e equipe técnica da série ${tv.name} no Deazons.`;
          }

          const jsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": isCastPage ? "WebPage" : "TVSeries",
            "name": tv.name,
            "description": description,
            "image": imageUrl,
            "datePublished": tv.first_air_date,
            "genre": (tv.genres || []).map(g => g.name)
          });

          const html = buildHTML({
            title,
            description,
            imageUrl,
            canonicalUrl,
            jsonLd,
            bodyContent: `
              <article>
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(description)}</p>
                ${tv.genres ? `<p><strong>Gêneros:</strong> ${tv.genres.map(g => escapeHtml(g.name)).join(', ')}</p>` : ''}
                <p><a href="${canonicalUrl}">Ver no Deazons</a></p>
              </article>
            `
          });

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
          return res.status(200).send(html);
        }
      } catch (err) {
        console.error(`Error fetching tv ${tvId}:`, err);
      }
    }

    // ── 6. PERSON DETAILS AND FILMOGRAPHY PAGES ──────────────────────────────
    const personMatch = urlPath.match(/^\/pessoas\/(\d+)-?([^/]*)/);
    if (personMatch) {
      const personId = personMatch[1];
      const personSlug = personMatch[2] || '';
      const isFilmography = personSlug === 'movie' || personSlug === 'tv' || urlPath.split('/').length > 3;
      const mediaType = urlPath.split('/')[3] || personSlug;
      
      const cacheKey = `person-${personId}`;
      try {
        const person = await fetchWithCache(
          `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_KEY}&language=pt-BR`,
          cacheKey
        );
        
        if (person && person.name) {
          const canonicalUrl = `https://deazons.com/pessoas/${personId}${isFilmography ? `/${mediaType}` : ''}`;
          const imageUrl = person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null;
          
          let title = `${person.name} | Ator/Atriz | Deazons`;
          let description = person.biography 
            ? person.biography.substring(0, 160) + '...' 
            : `Veja a filmografia completa, fotos e informações sobre ${person.name} no Deazons.`;
          
          if (isFilmography) {
            const typeStr = mediaType === 'tv' ? 'séries' : 'filmes';
            title = `Filmografia de ${person.name} (${typeStr}) | Deazons`;
            description = `Confira a filmografia completa com todos os ${typeStr} de ${person.name} no Deazons.`;
          }

          const jsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": person.name,
            "description": description,
            "image": imageUrl,
            "url": canonicalUrl
          });

          const html = buildHTML({
            title,
            description,
            imageUrl,
            canonicalUrl,
            jsonLd,
            bodyContent: `
              <article>
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(description)}</p>
                <p><a href="${canonicalUrl}">Ver no Deazons</a></p>
              </article>
            `
          });

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
          return res.status(200).send(html);
        }
      } catch (err) {
        console.error(`Error fetching person ${personId}:`, err);
      }
    }

    // ── 7. NEWS ARTICLES (SUPABASE) ──────────────────────────────────────────
    const newsMatch = urlPath.match(/^\/noticias\/([^/?]+)/);
    if (newsMatch && SUPABASE_URL) {
      const slug = newsMatch[1];
      const apiUrl = `${SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&status=eq.published&select=title,meta_description,image_url,content,published_at,category,tags&limit=1`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      
      if (response.ok) {
        const articles = await response.json();
        const article = articles[0];
        
        if (article) {
          const canonicalUrl = `https://deazons.com/noticias/${slug}`;
          const jsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.meta_description,
            "image": article.image_url ? [article.image_url] : [],
            "datePublished": article.published_at,
            "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
          });

          const textContent = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 800);

          const html = buildHTML({
            title: `${article.title} | Deazons`,
            description: article.meta_description || '',
            imageUrl: article.image_url,
            canonicalUrl,
            jsonLd,
            bodyContent: `
              <article>
                <h1>${escapeHtml(article.title)}</h1>
                <p><strong>Categoria:</strong> ${escapeHtml(article.category || '')}</p>
                <p>${escapeHtml(textContent)}...</p>
                <p><a href="${canonicalUrl}">Leia o artigo completo no Deazons</a></p>
              </article>
            `
          });

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
          return res.status(200).send(html);
        }
      }
    }

    // ── 8. BLOG POSTS ────────────────────────────────────────────────────────
    const blogMatch = urlPath.match(/^\/blog\/([^/?]+)/);
    if (blogMatch) {
      const postSlug = blogMatch[1];
      const post = blogPosts.find(p => p.slug === postSlug);
      if (post) {
        const canonicalUrl = `https://deazons.com/blog/${postSlug}`;
        const images = imagesData[postSlug] || [];
        const imageUrl = images.length > 0 ? images[0].url : 'https://deazons.com/deazons-logo.png';
        const title = `${post.title} | Blog Deazons`;
        const description = post.description;

        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": description,
          "image": imageUrl ? [imageUrl] : [],
          "datePublished": post.publishedAt,
          "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
        });

        const html = buildHTML({
          title,
          description,
          imageUrl,
          canonicalUrl,
          jsonLd,
          bodyContent: `
            <article>
              <h1>${escapeHtml(post.title)}</h1>
              <p>${escapeHtml(description)}</p>
              <p><a href="${canonicalUrl}">Leia o artigo no blog do Deazons</a></p>
            </article>
          `
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).send(html);
      }
    }

    // Fallback — bot acessou rota não reconhecida
    return res.status(404).end();

  } catch (err) {
    console.error('Prerender error:', err);
    return res.status(500).end();
  }
}
