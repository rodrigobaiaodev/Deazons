/**
 * Vercel Serverless Function — Bot Prerender
 *
 * Serves HTML with unique title/description/canonical/OG/JSON-LD for crawlers.
 * Wired via vercel.json User-Agent rewrite.
 */

import { blogPosts } from '../src/blog/data/posts.js';
import * as fs from 'fs';
import * as path from 'path';

let imagesData: Record<string, { url: string }[]> = {};
try {
  imagesData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/blog/data/images.json'), 'utf-8')
  );
} catch (e) {
  console.warn('Could not load images.json', e);
}

const BOT_REGEX =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|mediapartners-google/i;

const BASE = 'https://deazons.com';
const DEFAULT_OG = `${BASE}/deazons-logo.png`;

const tmdbCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

async function fetchWithCache(url: string, cacheKey: string) {
  const now = Date.now();
  if (tmdbCache.has(cacheKey)) {
    const cached = tmdbCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL_MS) return cached.data;
    tmdbCache.delete(cacheKey);
  }
  if (tmdbCache.size >= MAX_CACHE_SIZE) {
    tmdbCache.delete(tmdbCache.keys().next().value);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  tmdbCache.set(cacheKey, { timestamp: now, data });
  return data;
}

function isBot(userAgent = '') {
  return BOT_REGEX.test(userAgent);
}

/** Truncate at word boundary — never mid-word */
function truncateAtWord(str: string, max = 160): string {
  if (!str) return '';
  const clean = String(str).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Allow safe HTML tags for bot-readable full article bodies (Discover / indexing) */
function sanitizeHtmlForBot(html = '') {
  let out = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  out = out.replace(/<(?!\/?(?:p|h2|h3|ul|ol|li|blockquote|strong|em|b|i|br|figure|figcaption|img|a)(?:\s|>|\/))/gi, '&lt;');

  out = out.replace(/<img\b([^>]*)>/gi, (_, attrs) => {
    const src = (attrs.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
    if (!src || /^javascript:/i.test(src)) return '';
    const alt = (attrs.match(/\balt=["']([^"']*)["']/i) || [])[1] || '';
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
  });

  out = out.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, text) => {
    const href = (attrs.match(/\bhref=["']([^"']+)["']/i) || [])[1] || '';
    const plain = text.replace(/<[^>]+>/g, '');
    if (href.startsWith('/') || /^https?:\/\/(www\.)?deazons\.com/i.test(href)) {
      const path = href.startsWith('/') ? href : href.replace(/^https?:\/\/(www\.)?deazons\.com/i, '');
      return `<a href="${escapeHtml(path)}">${escapeHtml(plain)}</a>`;
    }
    return escapeHtml(plain);
  });

  return out;
}

function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildHTML({
  title,
  description,
  imageUrl,
  canonicalUrl,
  jsonLd,
  bodyContent,
  ogType = 'website',
  noIndex = false,
  publishedTime,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  canonicalUrl: string;
  jsonLd?: string | object | object[] | null;
  bodyContent: string;
  ogType?: string;
  noIndex?: boolean;
  publishedTime?: string | null;
}) {
  const desc = truncateAtWord(description, 160);
  const img = imageUrl || DEFAULT_OG;
  let ldBlock = '';
  if (jsonLd) {
    const payload = typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd);
    ldBlock = `<script type="application/ld+json">${payload}</script>`;
  }
  const publishedMeta = publishedTime
    ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />
  <meta property="article:modified_time" content="${escapeHtml(publishedTime)}" />`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="robots" content="${noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Deazons" />
  <meta property="og:locale" content="pt_BR" />
  ${publishedMeta}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@deazons" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${img}" />
  ${ldBlock}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

function sendHtml(res: any, html: string, status = 200, cache = 's-maxage=86400, stale-while-revalidate=604800') {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('Vary', 'User-Agent');
  return res.status(status).send(html);
}

export default async function handler(req: any, res: any) {
  const parsedUrl = new URL(req.url, BASE);
  res.setHeader('Vary', 'User-Agent');

  let urlPath = parsedUrl.searchParams.get('url') || req.url || '/';
  urlPath = urlPath.split('?')[0].split('#')[0];
  if (urlPath.endsWith('/') && urlPath.length > 1) {
    urlPath = urlPath.slice(0, -1);
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const TMDB_KEY = process.env.VITE_TMDB_API_KEY || '6ea976a00b674fb5087f7e37ff72f45c';

  try {
    // ── 1. HOME ──────────────────────────────────────────────────────────────
    if (urlPath === '/' || urlPath === '/index.html' || urlPath === '') {
      const title = 'Deazons | Filmes, Séries e Notícias de Entretenimento';
      const description =
        'Descubra informações sobre milhares de filmes, séries e atores no Deazons — portal de entretenimento com notícias, trailers e onde assistir.';
      const canonicalUrl = `${BASE}/`;
      return sendHtml(
        res,
        buildHTML({
          title,
          description,
          canonicalUrl,
          ogType: 'website',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Deazons',
              url: BASE,
              inLanguage: 'pt-BR',
            },
            breadcrumbLd([{ name: 'Início', url: canonicalUrl }]),
          ],
          bodyContent: `<h1>Deazons</h1><p>${escapeHtml(description)}</p>
            <nav><a href="${BASE}/filmes">Filmes</a> · <a href="${BASE}/series">Séries</a> · <a href="${BASE}/noticias">Notícias</a> · <a href="${BASE}/blog">Blog</a></nav>`,
        })
      );
    }

    // ── 2. LIST / CATEGORY PAGES ─────────────────────────────────────────────
    const listPages: Record<
      string,
      { title: string; description: string; h1: string; crumb: string }
    > = {
      '/filmes': {
        title: 'Filmes Populares | Deazons',
        description:
          'Explore filmes populares no Deazons. Trailers, elenco, sinopse e onde assistir em streaming.',
        h1: 'Filmes Populares',
        crumb: 'Filmes',
      },
      '/series': {
        title: 'Séries Populares | Deazons',
        description:
          'Explore séries populares no Deazons. Trailers, elenco, sinopse e onde assistir em streaming.',
        h1: 'Séries Populares',
        crumb: 'Séries',
      },
      '/pessoas': {
        title: 'Famosos, Atores e Atrizes | Deazons',
        description:
          'Conheça atores, atrizes e cineastas populares. Biografias, fotos e filmografias no Deazons.',
        h1: 'Pessoas',
        crumb: 'Pessoas',
      },
      '/noticias': {
        title: 'Notícias de Filmes, Séries e Cinema | Deazons',
        description:
          'Últimas notícias, novidades, rumores e lançamentos de cinema, séries e streaming no Deazons.',
        h1: 'Notícias',
        crumb: 'Notícias',
      },
      '/blog': {
        title: 'Blog de Cinema e Entretenimento | Deazons',
        description:
          'Artigos, análises, listas e curiosidades sobre cinema, séries e streaming no Blog do Deazons.',
        h1: 'Blog',
        crumb: 'Blog',
      },
    };

    if (listPages[urlPath]) {
      const info = listPages[urlPath];
      const canonicalUrl = `${BASE}${urlPath}`;
      return sendHtml(
        res,
        buildHTML({
          title: info.title,
          description: info.description,
          canonicalUrl,
          ogType: 'website',
          jsonLd: [
            breadcrumbLd([
              { name: 'Início', url: `${BASE}/` },
              { name: info.crumb, url: canonicalUrl },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: info.h1,
              description: info.description,
              url: canonicalUrl,
            },
          ],
          bodyContent: `<nav><a href="${BASE}/">Início</a> › ${escapeHtml(info.crumb)}</nav>
            <h1>${escapeHtml(info.h1)}</h1>
            <p>${escapeHtml(info.description)}</p>`,
        })
      );
    }

    // ── 3. STATIC PAGES ──────────────────────────────────────────────────────
    const staticPages: Record<string, { title: string; description: string }> = {
      '/sobre': {
        title: 'Sobre o Deazons | Filmes, Séries e Entretenimento',
        description:
          'Saiba mais sobre o Deazons, nossa missão e como trazemos informações sobre cinema e entretenimento.',
      },
      '/privacidade': {
        title: 'Política de Privacidade | Deazons',
        description:
          'Leia a Política de Privacidade do Deazons. Saiba como coletamos, usamos e protegemos seus dados.',
      },
      '/termos': {
        title: 'Termos de Serviço | Deazons',
        description:
          'Leia os Termos de Serviço do Deazons: condições de uso e diretrizes da plataforma.',
      },
      '/contato': {
        title: 'Contato | Deazons',
        description:
          'Entre em contato com a equipe do Deazons para parcerias, sugestões, dúvidas ou feedback.',
      },
    };

    if (staticPages[urlPath]) {
      const info = staticPages[urlPath];
      const canonicalUrl = `${BASE}${urlPath}`;
      const label = info.title.split('|')[0].trim();
      return sendHtml(
        res,
        buildHTML({
          title: info.title,
          description: info.description,
          canonicalUrl,
          ogType: 'website',
          jsonLd: breadcrumbLd([
            { name: 'Início', url: `${BASE}/` },
            { name: label, url: canonicalUrl },
          ]),
          bodyContent: `<nav><a href="${BASE}/">Início</a> › ${escapeHtml(label)}</nav>
            <h1>${escapeHtml(label)}</h1>
            <p>${escapeHtml(info.description)}</p>`,
        })
      );
    }

    // ── 4. MOVIES ────────────────────────────────────────────────────────────
    const movieMatch = urlPath.match(/^\/filmes\/(\d+)(?:-([^/]*))?(\/cast)?$/);
    if (movieMatch) {
      const movieId = movieMatch[1];
      const isCastPage = Boolean(movieMatch[3]);
      try {
        const movie: any = await fetchWithCache(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}&language=pt-BR&append_to_response=credits`,
          `movie-${movieId}`
        );

        if (movie?.title) {
          const slug = slugify(movie.title);
          const canonicalUrl = `${BASE}/filmes/${movieId}-${slug}${isCastPage ? '/cast' : ''}`;
          const imageUrl = movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : movie.poster_path
              ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
              : null;
          const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
          const overview = truncateAtWord(movie.overview || '', 160);

          let title = `${movie.title}${year ? ` (${year})` : ''} | Deazons`;
          let description =
            overview ||
            `Veja detalhes, elenco e onde assistir ao filme ${movie.title} no Deazons.`;

          if (isCastPage) {
            title = `Elenco de ${movie.title}${year ? ` (${year})` : ''} | Deazons`;
            description = `Veja o elenco, atores, atrizes e equipe técnica do filme ${movie.title} no Deazons.`;
          }

          const cast = (movie.credits?.cast || [])
            .slice(0, 8)
            .map((c: any) => ({ '@type': 'Person', name: c.name }));
          const directors = (movie.credits?.crew || [])
            .filter((c: any) => c.job === 'Director')
            .map((c: any) => ({ '@type': 'Person', name: c.name }));

          const movieLd: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': isCastPage ? 'WebPage' : 'Movie',
            name: movie.title,
            description,
            image: imageUrl,
            datePublished: movie.release_date,
            url: canonicalUrl,
            genre: (movie.genres || []).map((g: any) => g.name),
          };
          if (!isCastPage) {
            if (directors.length) movieLd.director = directors;
            if (cast.length) movieLd.actor = cast;
            if (movie.vote_average > 0) {
              movieLd.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: Number(movie.vote_average).toFixed(1),
                bestRating: '10',
                ratingCount: movie.vote_count || 1,
              };
            }
          }

          const crumbs = [
            { name: 'Início', url: `${BASE}/` },
            { name: 'Filmes', url: `${BASE}/filmes` },
            { name: movie.title, url: `${BASE}/filmes/${movieId}-${slug}` },
          ];
          if (isCastPage) crumbs.push({ name: 'Elenco', url: canonicalUrl });

          return sendHtml(
            res,
            buildHTML({
              title,
              description,
              imageUrl,
              canonicalUrl,
              ogType: isCastPage ? 'website' : 'video.movie',
              jsonLd: [movieLd, breadcrumbLd(crumbs)],
              bodyContent: `<nav><a href="${BASE}/">Início</a> › <a href="${BASE}/filmes">Filmes</a> › ${escapeHtml(movie.title)}${isCastPage ? ' › Elenco' : ''}</nav>
                <article>
                  <h1>${escapeHtml(isCastPage ? `Elenco de ${movie.title}` : movie.title)}</h1>
                  <p>${escapeHtml(description)}</p>
                  ${movie.genres?.length ? `<p><strong>Gêneros:</strong> ${movie.genres.map((g: any) => escapeHtml(g.name)).join(', ')}</p>` : ''}
                  ${movie.release_date ? `<p><strong>Lançamento:</strong> ${escapeHtml(movie.release_date)}</p>` : ''}
                  ${!isCastPage && cast.length ? `<p><strong>Elenco:</strong> ${cast.map((c: any) => escapeHtml(c.name)).join(', ')}</p>` : ''}
                  <p><a href="${canonicalUrl}">Ver no Deazons</a></p>
                </article>`,
            })
          );
        }
      } catch (err) {
        console.error(`Error fetching movie ${movieId}:`, err);
      }

      return sendHtml(
        res,
        buildHTML({
          title: 'Filme não encontrado | Deazons',
          description: 'O filme solicitado não foi encontrado no Deazons.',
          canonicalUrl: `${BASE}${urlPath}`,
          noIndex: true,
          bodyContent: `<h1>Filme não encontrado</h1><p><a href="${BASE}/filmes">Ver filmes</a></p>`,
        }),
        404,
        's-maxage=300'
      );
    }

    // ── 5. SERIES ────────────────────────────────────────────────────────────
    const seriesMatch = urlPath.match(/^\/series\/(\d+)(?:-([^/]*))?(\/cast)?$/);
    if (seriesMatch) {
      const tvId = seriesMatch[1];
      const isCastPage = Boolean(seriesMatch[3]);
      try {
        const tv: any = await fetchWithCache(
          `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_KEY}&language=pt-BR&append_to_response=credits`,
          `tv-${tvId}`
        );

        if (tv?.name) {
          const slug = slugify(tv.name);
          const canonicalUrl = `${BASE}/series/${tvId}-${slug}${isCastPage ? '/cast' : ''}`;
          const imageUrl = tv.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`
            : tv.poster_path
              ? `https://image.tmdb.org/t/p/w780${tv.poster_path}`
              : null;
          const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : '';
          const overview = truncateAtWord(tv.overview || '', 160);

          let title = `${tv.name}${year ? ` (${year})` : ''} | Deazons`;
          let description =
            overview || `Veja detalhes, elenco e onde assistir à série ${tv.name} no Deazons.`;

          if (isCastPage) {
            title = `Elenco de ${tv.name}${year ? ` (${year})` : ''} | Deazons`;
            description = `Veja o elenco, atores, atrizes e equipe técnica da série ${tv.name} no Deazons.`;
          }

          const cast = (tv.credits?.cast || [])
            .slice(0, 8)
            .map((c: any) => ({ '@type': 'Person', name: c.name }));

          const tvLd: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': isCastPage ? 'WebPage' : 'TVSeries',
            name: tv.name,
            description,
            image: imageUrl,
            datePublished: tv.first_air_date,
            url: canonicalUrl,
            genre: (tv.genres || []).map((g: any) => g.name),
          };
          if (!isCastPage) {
            if (cast.length) tvLd.actor = cast;
            if (tv.vote_average > 0) {
              tvLd.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: Number(tv.vote_average).toFixed(1),
                bestRating: '10',
                ratingCount: tv.vote_count || 1,
              };
            }
          }

          const crumbs = [
            { name: 'Início', url: `${BASE}/` },
            { name: 'Séries', url: `${BASE}/series` },
            { name: tv.name, url: `${BASE}/series/${tvId}-${slug}` },
          ];
          if (isCastPage) crumbs.push({ name: 'Elenco', url: canonicalUrl });

          return sendHtml(
            res,
            buildHTML({
              title,
              description,
              imageUrl,
              canonicalUrl,
              ogType: isCastPage ? 'website' : 'video.tv_show',
              jsonLd: [tvLd, breadcrumbLd(crumbs)],
              bodyContent: `<nav><a href="${BASE}/">Início</a> › <a href="${BASE}/series">Séries</a> › ${escapeHtml(tv.name)}${isCastPage ? ' › Elenco' : ''}</nav>
                <article>
                  <h1>${escapeHtml(isCastPage ? `Elenco de ${tv.name}` : tv.name)}</h1>
                  <p>${escapeHtml(description)}</p>
                  ${tv.genres?.length ? `<p><strong>Gêneros:</strong> ${tv.genres.map((g: any) => escapeHtml(g.name)).join(', ')}</p>` : ''}
                  <p><a href="${canonicalUrl}">Ver no Deazons</a></p>
                </article>`,
            })
          );
        }
      } catch (err) {
        console.error(`Error fetching tv ${tvId}:`, err);
      }

      return sendHtml(
        res,
        buildHTML({
          title: 'Série não encontrada | Deazons',
          description: 'A série solicitada não foi encontrada no Deazons.',
          canonicalUrl: `${BASE}${urlPath}`,
          noIndex: true,
          bodyContent: `<h1>Série não encontrada</h1><p><a href="${BASE}/series">Ver séries</a></p>`,
        }),
        404,
        's-maxage=300'
      );
    }

    // ── 6. PEOPLE ────────────────────────────────────────────────────────────
    const personMatch = urlPath.match(/^\/pessoas\/(\d+)(?:-([^/]*))?(?:\/(movie|tv))?$/);
    if (personMatch) {
      const personId = personMatch[1];
      const mediaType = personMatch[3] || '';
      const isFilmography = mediaType === 'movie' || mediaType === 'tv';

      try {
        const person: any = await fetchWithCache(
          `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_KEY}&language=pt-BR`,
          `person-${personId}`
        );

        if (person?.name) {
          const slug = slugify(person.name);
          const basePersonUrl = `${BASE}/pessoas/${personId}-${slug}`;
          const canonicalUrl = isFilmography ? `${basePersonUrl}/${mediaType}` : basePersonUrl;
          const imageUrl = person.profile_path
            ? `https://image.tmdb.org/t/p/w780${person.profile_path}`
            : null;

          let title = `${person.name} | Ator/Atriz | Deazons`;
          let description = person.biography
            ? truncateAtWord(person.biography, 160)
            : `Veja a filmografia completa, fotos e informações sobre ${person.name} no Deazons.`;

          if (isFilmography) {
            const typeStr = mediaType === 'tv' ? 'séries' : 'filmes';
            title = `Filmografia de ${person.name} (${typeStr}) | Deazons`;
            description = `Confira a filmografia completa com todos os ${typeStr} de ${person.name} no Deazons.`;
          }

          const personLd = {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: person.name,
            description,
            image: imageUrl,
            url: basePersonUrl,
            ...(person.birthday && { birthDate: person.birthday }),
          };

          const crumbs = [
            { name: 'Início', url: `${BASE}/` },
            { name: 'Pessoas', url: `${BASE}/pessoas` },
            { name: person.name, url: basePersonUrl },
          ];
          if (isFilmography) {
            crumbs.push({
              name: mediaType === 'tv' ? 'Séries' : 'Filmes',
              url: canonicalUrl,
            });
          }

          return sendHtml(
            res,
            buildHTML({
              title,
              description,
              imageUrl,
              canonicalUrl,
              ogType: 'profile',
              jsonLd: [personLd, breadcrumbLd(crumbs)],
              bodyContent: `<nav><a href="${BASE}/">Início</a> › <a href="${BASE}/pessoas">Pessoas</a> › ${escapeHtml(person.name)}</nav>
                <article>
                  <h1>${escapeHtml(person.name)}</h1>
                  <p>${escapeHtml(description)}</p>
                  <p><a href="${canonicalUrl}">Ver no Deazons</a></p>
                </article>`,
            })
          );
        }
      } catch (err) {
        console.error(`Error fetching person ${personId}:`, err);
      }

      return sendHtml(
        res,
        buildHTML({
          title: 'Pessoa não encontrada | Deazons',
          description: 'A pessoa solicitada não foi encontrada no Deazons.',
          canonicalUrl: `${BASE}${urlPath}`,
          noIndex: true,
          bodyContent: `<h1>Pessoa não encontrada</h1><p><a href="${BASE}/pessoas">Ver pessoas</a></p>`,
        }),
        404,
        's-maxage=300'
      );
    }

    // ── 7. NEWS ARTICLES ─────────────────────────────────────────────────────
    const newsMatch = urlPath.match(/^\/noticias\/([^/?]+)/);
    if (newsMatch) {
      const slug = newsMatch[1];
      const canonicalUrl = `${BASE}/noticias/${slug}`;

      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const apiUrl = `${SUPABASE_URL}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,meta_description,image_url,content,published_at,created_at,category,tags&limit=1`;
          const response = await fetch(apiUrl, {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          });

          if (response.ok) {
            const articles = await response.json();
            const article = articles[0];

            if (article) {
              const textContent = (article.content || '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              const description =
                truncateAtWord(article.meta_description || textContent, 160) ||
                truncateAtWord(article.title, 160);

              const articleLd = {
                '@context': 'https://schema.org',
                '@type': 'NewsArticle',
                headline: article.title,
                description,
                image: article.image_url ? [article.image_url] : [],
                datePublished: article.published_at,
                dateModified: article.published_at || article.created_at,
                author: { '@type': 'Organization', name: 'Deazons' },
                publisher: {
                  '@type': 'Organization',
                  name: 'Deazons',
                  logo: { '@type': 'ImageObject', url: DEFAULT_OG },
                },
                mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
              };

              return sendHtml(
                res,
                buildHTML({
                  title: truncateAtWord(`${article.title} | Deazons`, 65),
                  description,
                  imageUrl: article.image_url,
                  canonicalUrl,
                  ogType: 'article',
                  publishedTime: article.published_at || article.created_at,
                  jsonLd: [
                    articleLd,
                    breadcrumbLd([
                      { name: 'Início', url: `${BASE}/` },
                      { name: 'Notícias', url: `${BASE}/noticias` },
                      { name: article.title, url: canonicalUrl },
                    ]),
                  ],
                  bodyContent: `<nav><a href="${BASE}/">Início</a> › <a href="${BASE}/noticias">Notícias</a> › ${escapeHtml(article.title)}</nav>
                    <article>
                      <h1>${escapeHtml(article.title)}</h1>
                      ${article.image_url ? `<p><img src="${escapeHtml(article.image_url)}" alt="${escapeHtml(article.title)}" width="1200" height="630" /></p>` : ''}
                      ${article.category ? `<p><strong>Categoria:</strong> ${escapeHtml(article.category)}</p>` : ''}
                      ${article.published_at ? `<p><time datetime="${escapeHtml(article.published_at)}">${escapeHtml(article.published_at.split('T')[0])}</time></p>` : ''}
                      <div class="article-body">${sanitizeHtmlForBot(article.content || '')}</div>
                    </article>`,
                }),
                200,
                's-maxage=3600, stale-while-revalidate=86400'
              );
            }
          }
        } catch (err) {
          console.error(`Error fetching article ${slug}:`, err);
        }
      }

      return sendHtml(
        res,
        buildHTML({
          title: 'Notícia não encontrada | Deazons',
          description: 'O artigo solicitado não foi encontrado no Deazons.',
          canonicalUrl,
          noIndex: true,
          bodyContent: `<h1>Notícia não encontrada</h1><p><a href="${BASE}/noticias">Ver notícias</a></p>`,
        }),
        404,
        's-maxage=300'
      );
    }

    // ── 8. BLOG POSTS ────────────────────────────────────────────────────────
    const blogMatch = urlPath.match(/^\/blog\/([^/?]+)/);
    if (blogMatch) {
      const postSlug = blogMatch[1];
      const post = blogPosts.find((p: any) => p.slug === postSlug);
      const canonicalUrl = `${BASE}/blog/${postSlug}`;

      if (post) {
        const images = imagesData[postSlug] || [];
        const imageUrl = images.length > 0 ? images[0].url : DEFAULT_OG;
        const title = `${post.title} | Blog Deazons`;
        const description = truncateAtWord(post.description || '', 160);

        const blogLd = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description,
          image: imageUrl ? [imageUrl] : [],
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          author: { '@type': 'Organization', name: 'Deazons' },
          publisher: {
            '@type': 'Organization',
            name: 'Deazons',
            logo: { '@type': 'ImageObject', url: DEFAULT_OG },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        };

        return sendHtml(
          res,
          buildHTML({
            title,
            description,
            imageUrl,
            canonicalUrl,
            ogType: 'article',
            jsonLd: [
              blogLd,
              breadcrumbLd([
                { name: 'Início', url: `${BASE}/` },
                { name: 'Blog', url: `${BASE}/blog` },
                { name: post.title, url: canonicalUrl },
              ]),
            ],
            bodyContent: `<nav><a href="${BASE}/">Início</a> › <a href="${BASE}/blog">Blog</a> › ${escapeHtml(post.title)}</nav>
              <article>
                <h1>${escapeHtml(post.title)}</h1>
                <p>${escapeHtml(description)}</p>
                <p><a href="${canonicalUrl}">Leia o artigo no blog do Deazons</a></p>
              </article>`,
          })
        );
      }

      return sendHtml(
        res,
        buildHTML({
          title: 'Post não encontrado | Deazons',
          description: 'O post solicitado não foi encontrado no Blog do Deazons.',
          canonicalUrl,
          noIndex: true,
          bodyContent: `<h1>Post não encontrado</h1><p><a href="${BASE}/blog">Ver blog</a></p>`,
        }),
        404,
        's-maxage=300'
      );
    }

    // Unknown route for bots
    return sendHtml(
      res,
      buildHTML({
        title: 'Página não encontrada | Deazons',
        description: 'A página solicitada não existe no Deazons.',
        canonicalUrl: `${BASE}${urlPath}`,
        noIndex: true,
        bodyContent: `<h1>404</h1><p><a href="${BASE}/">Voltar ao início</a></p>`,
      }),
      404,
      's-maxage=300'
    );
  } catch (err) {
    console.error('Prerender error:', err);
    return res.status(500).end();
  }
}

// Keep helper referenced (UA gating is also in vercel.json)
void isBot;
