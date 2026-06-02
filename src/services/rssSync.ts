import { supabaseAdmin, RssSource, Article } from '@/lib/supabase';
import { GROQ_MODEL, rewriteArticlePrompt } from '@/lib/groq';
import { tmdbAPI } from './tmdb';

// Uses VITE_GROQ_API_KEY exposed to the browser; all calls go through the REST API
// so the Node.js-only groq-sdk is never imported here.
// NOTE: set VITE_GROQ_API_KEY in Vercel Environment Variables for the RSS admin panel to work.
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

if (!GROQ_API_KEY) {
  console.warn(
    '[rssSync] VITE_GROQ_API_KEY is not set. ' +
    'RSS import via AI will fail. Add it to Vercel Environment Variables.'
  );
}

async function callGroqRest(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error(
      'VITE_GROQ_API_KEY não está configurada. ' +
      'Adicione essa variável nas Environment Variables do Vercel.'
    );
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

const CORS_PROXY = 'https://corsproxy.io/?url=';

const parseRssXml = (xmlStr: string) => {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  const getTag = (xmlStr: string, tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
    const m = xmlStr.match(regex);
    return m ? m[1].trim() : null;
  };

  const getAttribute = (xmlStr: string, tag: string, attr: string) => {
    const regex = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
    const m = xmlStr.match(regex);
    return m ? m[1] : null;
  };

  while ((match = itemRegex.exec(xmlStr)) !== null) {
    const itemXml = match[1];
    const title = getTag(itemXml, 'title');
    const link = getTag(itemXml, 'link');
    const description = getTag(itemXml, 'description');
    const content = getTag(itemXml, 'content:encoded');
    const pubDate = getTag(itemXml, 'pubDate');
    
    const categories: string[] = [];
    const categoryRegex = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category>([\s\S]*?)<\/category>/gi;
    let catMatch;
    while ((catMatch = categoryRegex.exec(itemXml)) !== null) {
      categories.push((catMatch[1] || catMatch[2]).trim());
    }
    
    let imageUrl = getAttribute(itemXml, 'media:content', 'url') || getAttribute(itemXml, 'enclosure', 'url');
    if (!imageUrl && content) {
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    if (!imageUrl && description) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    
    if (title && link) {
      items.push({
        title,
        link,
        description: content || description || '', 
        content: content || description || '',
        pubDate,
        thumbnail: imageUrl,
        enclosure: imageUrl ? { link: imageUrl } : null,
        categories
      });
    }
  }
  return items;
};
const MAX_ARTICLES_PER_RUN = 10;

export const getFeedsFromDB = async (): Promise<RssSource[]> => {
  const { data, error } = await supabaseAdmin
    .from('rss_sources')
    .select('*')
    .eq('active', true);

  if (error) {
    console.error('Error fetching RSS sources:', error);
    return [];
  }
  return data || [];
};

const extractTags = (item: any): string[] => {
  if (item.categories && Array.isArray(item.categories)) {
    return item.categories;
  }
  return [];
};

const parseAIResponse = (text: string) => {
  try {
    // 1. Limpeza básica: remover blocos de markdown ```json e ```
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Tentar parse direto
    try {
      return JSON.parse(cleanText);
    } catch (e) {
      // 3. Tentar extrair com Regex se o parse falhar
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Não foi possível encontrar um objeto JSON na resposta.");
    }
  } catch (err: any) {
    console.error("Erro ao parsear resposta da IA:", err.message);
    return null;
  }
};

const extractImage = (item: any): string | null => {
  // Try enclosure link
  if (item.enclosure && item.enclosure.link) {
    return item.enclosure.link;
  }

  // Try thumbnail from rss2json
  if (item.thumbnail) {
    return item.thumbnail;
  }

  // Try parsing from content
  const content = item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
};

/** Remove TODAS as tags <img> e <figure> do HTML gerado pelo Gemini */
const stripImagesFromContent = (html: string): string => {
  return html
    .replace(/<img[^>]*\/?>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** Gera slug seguro sem caracteres especiais */
const safeSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 90);
};

// Use TMDB as fallback for cover image
const getTMDBCoverImage = async (title: string): Promise<string | null> => {
  try {
    const searchTitle = title
      .replace(/Review|Crítica|Trailer|Teaser|Confirmado|Rumor|Entrevista/gi, '')
      .split(':')[0]
      .split('-')[0]
      .trim();

    if (!searchTitle) return null;

    const data = await tmdbAPI.searchMulti(searchTitle);
    const results = (data.results || []).filter(
      (r: any) => (r.media_type === 'movie' || r.media_type === 'tv')
    );

    if (results.length > 0) {
      const first = results[0] as any;
      if (first.backdrop_path) return `https://image.tmdb.org/t/p/w1280${first.backdrop_path}`;
      if (first.poster_path) return `https://image.tmdb.org/t/p/w780${first.poster_path}`;
    }
    return null;
  } catch (error) {
    console.error('TMDB images error for title:', title, error);
    return null;
  }
};

export const fetchAndProcessFeeds = async (
  onProgress: (msg: string) => void
): Promise<void> => {
  onProgress('Buscando fontes cadastradas no banco...');
  const sources = await getFeedsFromDB();

  if (sources.length === 0) {
    onProgress('Nenhuma fonte ativa encontrada.');
    return;
  }

  let articlesCreated = 0;

  outer:
  for (const source of sources) {
    onProgress(`Lendo feed: ${source.name} (${source.url})...`);

    try {
      // Use corsproxy to avoid CORS errors in browser
      const apiUrl = `${CORS_PROXY}${encodeURIComponent(source.url)}`;
      const response = await fetch(apiUrl);
      const xmlData = await response.text();
      
      const items = parseRssXml(xmlData);

      if (items.length === 0) {
        throw new Error(`Nenhum item encontrado na resposta XML.`);
      }

      // update last_fetched
      await supabaseAdmin
        .from('rss_sources')
        .update({ last_fetched: new Date().toISOString() })
        .eq('id', source.id);

      onProgress(`Encontrados ${items.length} itens no feed ${source.name}. Processando novos...`);

      for (const item of items) {
        if (articlesCreated >= MAX_ARTICLES_PER_RUN) break outer;
        if (!item.link || !item.title) continue;

        // Check duplicates
        const { data: existing } = await supabaseAdmin
          .from('articles')
          .select('id')
          .eq('source_url', item.link)
          .single();

        if (existing) {
          continue;
        }

        onProgress(`Processando (${articlesCreated + 1}/${MAX_ARTICLES_PER_RUN}): ${item.title.substring(0, 40)}...`);

        // Imagem de capa: RSS primeiro, depois TMDB
        let imageUrl = extractImage(item);
        if (!imageUrl) {
          onProgress(`Buscando imagem no TMDB para: ${item.title.substring(0, 30)}...`);
          imageUrl = await getTMDBCoverImage(item.title);
        }
        // Fallback final
        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
        }

        // Prepare content for Gemini (sem passar extra images)
        const rawContent = item.content || item.description || '';
        const prompt = rewriteArticlePrompt(item.title, rawContent, imageUrl);

        try {
          // Groq Call via REST (browser-safe — no groq-sdk)
          const text = await callGroqRest(prompt);

          const articleData = parseAIResponse(text);

          if (!articleData) {
            console.warn('Could not parse AI response for:', item.title);
            onProgress(`❌ Falha ao processar texto da IA para: ${item.title.substring(0, 30)}`);
            continue;
          }

          // Limpar imagens do conteúdo (sem repetição)
          const cleanContent = stripImagesFromContent(articleData.content || '');
          const finalSlug = safeSlug(articleData.slug || articleData.title || item.title);

          // Merge into DB
          const newArticle = {
             title: articleData.title,
             slug: finalSlug,
             content: cleanContent,
             meta_description: (articleData.meta_description || '').substring(0, 160),
             status: 'published',
             published_at: new Date().toISOString(),
             image_url: imageUrl,
             image_alt: articleData.title || item.title,
             tags: articleData.tags || extractTags(item),
             category: articleData.category,
             source_url: item.link
          };

          const { error: insertError } = await supabaseAdmin
            .from('articles')
            .insert(newArticle);

          if (insertError) {
             console.error('Error inserting article:', insertError);
             onProgress(`❌ Erro no banco ao salvar: ${articleData.title.substring(0, 30)} - ${insertError.message}`);
          } else {
             articlesCreated++;
             onProgress(`✅ Salvo: "${articleData.title.substring(0, 50)}"...`);
          }

        } catch (aiError: any) {
          console.error('Error generating content with Groq:', aiError);
          onProgress(`❌ Erro da IA (Groq): ${aiError?.message || 'Desconhecido'}`);
        }

        // Delay para respeitar rate limit
        onProgress('Aguardando 7s para respeitar limite da API...');
        await new Promise(resolve => setTimeout(resolve, 7000));
      }
    } catch (err: any) {
      console.error(`Error processing feed ${source.name}:`, err);
      onProgress(`Erro no feed ${source.name}: ${err?.message || 'Desconhecido'}. Pulando...`);
    }
  }

  onProgress(`\n📊 Processamento finalizado! ${articlesCreated} artigos criados nesta execução.`);
};
