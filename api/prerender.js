/**
 * Vercel Serverless Function — Bot Prerender
 * 
 * Detects Googlebot/crawlers and returns HTML enriquecido com meta tags
 * extraídas do Supabase (para artigos) ou TMDB (para filmes/séries).
 * 
 * Esta função é chamada pelo vercel.json para rotas específicas.
 */

const BOT_REGEX = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot/i;

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
  // URL vem do query param ?url= quando chamado pelo vercel.json routing
  // ou do req.url diretamente quando chamado pelo path /api/prerender
  const parsedUrl = new URL(req.url, 'https://deazons.com');
  const url = parsedUrl.searchParams.get('url') || req.url || '/';

  // Se não for bot, retorna 404 (o vercel.json vai servir index.html normalmente)
  if (!isBot(userAgent)) {
    return res.status(404).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const TMDB_KEY = process.env.VITE_TMDB_API_KEY || '6ea976a00b674fb5087f7e37ff72f45c';

  try {
    // Artigo de notícia: /noticias/[slug]
    const newsMatch = url.match(/^\/noticias\/([^/?]+)/);
    if (newsMatch && SUPABASE_URL) {
      const slug = newsMatch[1];
      const apiUrl = `${SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&status=eq.published&select=title,meta_description,image_url,content,published_at,category,tags&limit=1`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      
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
          "author": [{ "@type": "Organization", "name": "Equipe Deazons", "url": "https://deazons.com" }],
          "publisher": { "@type": "Organization", "name": "Deazons", "url": "https://deazons.com" },
          "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
        });

        // Strip HTML tags for body text
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

    // Filme: /filmes/[id-slug]
    const movieMatch = url.match(/^\/filmes\/(\d+)-?([^/?]*)/);
    if (movieMatch) {
      const movieId = movieMatch[1];
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}&language=pt-BR`);
      const movie = await tmdbRes.json();
      
      if (movie && movie.title) {
        const canonicalUrl = `https://deazons.com${req.url}`;
        const imageUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null;
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
        const title = `${movie.title}${year ? ` (${year})` : ''} | Deazons`;
        const description = movie.overview ? movie.overview.substring(0, 160) + '...' : `Veja detalhes, elenco e onde assistir ao filme ${movie.title} no Deazons.`;
        
        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Movie",
          "name": movie.title,
          "description": description,
          "image": imageUrl,
          "datePublished": movie.release_date,
          "genre": (movie.genres || []).map(g => g.name),
          "aggregateRating": movie.vote_average > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": movie.vote_average.toFixed(1),
            "bestRating": "10",
            "ratingCount": movie.vote_count
          } : undefined
        });

        const html = buildHTML({
          title,
          description,
          imageUrl,
          canonicalUrl,
          jsonLd,
          bodyContent: `
            <article>
              <h1>${escapeHtml(movie.title)}${year ? ` (${year})` : ''}</h1>
              <p>${escapeHtml(description)}</p>
              ${movie.genres ? `<p><strong>Gêneros:</strong> ${movie.genres.map(g => escapeHtml(g.name)).join(', ')}</p>` : ''}
              ${movie.vote_average > 0 ? `<p><strong>Nota:</strong> ${movie.vote_average.toFixed(1)}/10</p>` : ''}
              <p><a href="${canonicalUrl}">Ver mais detalhes no Deazons</a></p>
            </article>
          `
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).send(html);
      }
    }

    // Série: /series/[id-slug]
    const seriesMatch = url.match(/^\/series\/(\d+)-?([^/?]*)/);
    if (seriesMatch) {
      const tvId = seriesMatch[1];
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_KEY}&language=pt-BR`);
      const tv = await tmdbRes.json();
      
      if (tv && tv.name) {
        const canonicalUrl = `https://deazons.com${req.url}`;
        const imageUrl = tv.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}` : null;
        const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : '';
        const title = `${tv.name}${year ? ` (${year})` : ''} | Deazons`;
        const description = tv.overview ? tv.overview.substring(0, 160) + '...' : `Veja detalhes, elenco e onde assistir à série ${tv.name} no Deazons.`;

        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TVSeries",
          "name": tv.name,
          "description": description,
          "image": imageUrl,
          "datePublished": tv.first_air_date,
          "genre": (tv.genres || []).map(g => g.name),
          "aggregateRating": tv.vote_average > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": tv.vote_average.toFixed(1),
            "bestRating": "10",
            "ratingCount": tv.vote_count
          } : undefined
        });

        const html = buildHTML({
          title,
          description,
          imageUrl,
          canonicalUrl,
          jsonLd,
          bodyContent: `
            <article>
              <h1>${escapeHtml(tv.name)}${year ? ` (${year})` : ''}</h1>
              <p>${escapeHtml(description)}</p>
              ${tv.genres ? `<p><strong>Gêneros:</strong> ${tv.genres.map(g => escapeHtml(g.name)).join(', ')}</p>` : ''}
              ${tv.vote_average > 0 ? `<p><strong>Nota:</strong> ${tv.vote_average.toFixed(1)}/10</p>` : ''}
              <p><a href="${canonicalUrl}">Ver mais detalhes no Deazons</a></p>
            </article>
          `
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).send(html);
      }
    }

    // Fallback — bot acessou rota sem dados específicos
    return res.status(404).end();

  } catch (err) {
    console.error('Prerender error:', err);
    return res.status(500).end();
  }
}
