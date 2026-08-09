// groq.ts — browser-safe helpers only.
// The groq-sdk (Node.js only) must NEVER be imported here.
// All server-side Groq calls live in api/cron-articles.js and scripts/auto-sync-rss.js.

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const rewriteArticlePrompt = (
  title: string,
  content: string,
  _imageUrl?: string | null,
  _extraImageUrl1?: string | null,
  _extraImageUrl2?: string | null
) => {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const originalWords = plain ? plain.split(/\s+/).length : 0;
  const minWords = Math.max(220, Math.min(500, Math.floor(originalWords * 0.75) || 220));

  return `Você é um editor do portal brasileiro "Deazons" (cinema, séries e cultura pop).
PARAFASEIE o artigo abaixo em português do Brasil (AdSense / anti-plágio).

OBJETIVO:
- Manter o MESMO contexto, fatos, ordem e estrutura.
- Reescrever TODO o texto com outras palavras.
- NÃO inventar fatos nem expandir com opinião inventada.
- NÃO mencionar o site de origem.

REGRAS:
1. Mínimo ~${minWords} palavras (original ~${originalWords}). Fique perto do tamanho original.
2. HTML limpo: <p>, <h2>, <h3>, <ul>, <li>, <blockquote>, <figure>, <img> (só src/alt).
3. Remova links externos; pode manter 2 links internos naturais para /noticias, /filmes, /series ou /blog.
4. Preserve imagens do original na mesma posição relativa.
5. Sem <h1> no content.
6. meta_description 145–160 caracteres.

Responda APENAS JSON válido:
{
  "title": "Título parafraseado",
  "slug": "titulo-em-kebab-case-sem-acentos",
  "meta_description": "Descrição 145-160 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Uma de: Cinema, Séries, Marvel, DC, Lançamentos, Cultura Pop, Streaming, Anime",
  "content": "<p>...</p>"
}

Título: ${title}
Conteúdo:
${content.substring(0, 12000)}
`;
};
