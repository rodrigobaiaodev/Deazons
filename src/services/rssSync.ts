 
import { supabaseAdmin, RssSource, Article } from '@/lib/supabase';
import { geminiModel, rewriteArticlePrompt } from '@/lib/gemini';
import { tmdbAPI } from './tmdb';

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

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

const parseGeminiResponse = (text: string) => {
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
    console.error("Erro ao parsear resposta do Gemini:", err.message);
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

// Use TMDB as fallback and for extra images
const getTMDBImages = async (title: string): Promise<{ main: string | null, extra1: string | null, extra2: string | null }> => {
  const images = { main: null as string | null, extra1: null as string | null, extra2: null as string | null };
  
  try {
    const searchTitle = title
      .replace(/Review|Crítica|Trailer|Teaser|Confirmado|Rumor|Entrevista/gi, '')
      .split(':')[0]
      .split('-')[0]
      .trim();

    if (!searchTitle) return images;

    const data = await tmdbAPI.searchMulti(searchTitle);
    const results = (data.results || []).filter(
      (r: any) => (r.media_type === 'movie' || r.media_type === 'tv')
    );

    if (results.length > 0) {
      const first = results[0] as any;
      if (first.backdrop_path) images.main = `https://image.tmdb.org/t/p/w1280${first.backdrop_path}`;
      else if (first.poster_path) images.main = `https://image.tmdb.org/t/p/w780${first.poster_path}`;

      // Extra images from the same or different results
      const extraImages: string[] = [];
      results.forEach((res: any) => {
        if (res.backdrop_path) {
          const url = `https://image.tmdb.org/t/p/w780${res.backdrop_path}`;
          if (url !== images.main && !extraImages.includes(url)) extraImages.push(url);
        }
        if (res.poster_path) {
          const url = `https://image.tmdb.org/t/p/w780${res.poster_path}`;
          if (url !== images.main && !extraImages.includes(url)) extraImages.push(url);
        }
      });

      if (extraImages.length > 0) images.extra1 = extraImages[0];
      if (extraImages.length > 1) images.extra2 = extraImages[1];
    }
    
    return images;
  } catch (error) {
    console.error('TMDB images error for title:', title, error);
    return images;
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

  for (const source of sources) {
    onProgress(`Lendo feed: ${source.name} (${source.url})...`);

    try {
      // Use rss2json proxy to avoid CORS errors in browser
      const apiUrl = `${RSS2JSON_API}${encodeURIComponent(source.url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(`Status da API não é OK: ${JSON.stringify(data)}`);
      }

      const items = data.items || [];

      // update last_fetched
      await supabaseAdmin
        .from('rss_sources')
        .update({ last_fetched: new Date().toISOString() })
        .eq('id', source.id);

      onProgress(`Encontrados ${items.length} itens no feed ${source.name}. Processando novos...`);

      for (const item of items) {
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

        onProgress(`Processando: ${item.title.substring(0, 40)}...`);

        // Prepare content for Gemini
        const rawContent = item.content || item.description || '';
        
        // Images - extract before prompt to send to Gemini
        let imageUrl = extractImage(item);
        let extraImageUrl1 = null;
        let extraImageUrl2 = null;

        onProgress(`Buscando imagens no TMDB para: ${item.title.substring(0, 30)}...`);
        const tmdbImages = await getTMDBImages(item.title);
        
        if (!imageUrl) imageUrl = tmdbImages.main;
        extraImageUrl1 = tmdbImages.extra1;
        extraImageUrl2 = tmdbImages.extra2;
        
        const prompt = rewriteArticlePrompt(item.title, rawContent, imageUrl, extraImageUrl1, extraImageUrl2);

        try {
          // Gemini Call
          const result = await geminiModel.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          const articleData = parseGeminiResponse(text);

          if (!articleData) {
            console.warn('Could not parse Gemini response for:', item.title);
            console.log('--- GEMINI RAW RESPONSE --- \n', text, '\n---------------------------');
            onProgress(`❌ Falha ao processar texto da IA para: ${item.title.substring(0, 30)}`);
            continue;
          }

          const altText = articleData.title || item.title;

          // Merge into DB
          const newArticle = {
             title: articleData.title,
             slug: articleData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
             content: articleData.content,
             meta_description: articleData.meta_description,
             status: 'published',
             published_at: new Date().toISOString(),
             image_url: imageUrl,
             image_alt: altText,
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
             onProgress(`✅ Salvo e Publicado com sucesso: ${articleData.title.substring(0, 30)}...`);
          }

        } catch (geminiError: any) {
          console.error('Error generating content with Gemini:', geminiError);
          onProgress(`❌ Erro da IA (Gemini): ${geminiError?.message || 'Desconhecido'}`);
        }

        // Add 5-second delay to avoid rate limits on free tier (15 RPM)
        onProgress('Aguardando 5 segundos para respeitar o limite da API gratuita...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (err: any) {
      console.error(`Error processing feed ${source.name}:`, err);
      onProgress(`Erro no feed ${source.name}: ${err?.message || 'Desconhecido'}. Pulando...`);
    }
  }

  onProgress('Processamento finalizado!');
};
