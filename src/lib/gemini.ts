import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Gemini API key is not defined in environment variables');
}

export const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.75,
    maxOutputTokens: 4096,
  },
});

export const rewriteArticlePrompt = (
  title: string, 
  content: string,
  imageUrl?: string | null,
  // Parâmetros mantidos para compatibilidade mas não usados mais
  _extraImageUrl1?: string | null,
  _extraImageUrl2?: string | null
) => `Você é um redator sênior do portal de entretenimento "Deazons" (Brasil).
Reescreva o artigo abaixo em português brasileiro de forma 100% original, autoritativa e otimizada para SEO e AdSense.

REGRAS OBRIGATÓRIAS:
1. Mínimo de 900 palavras. Expanda com contexto histórico, curiosidades, impacto cultural, bilheteria e perspectivas futuras.
2. Tom envolvente, opinativo e "nerd" profissional.
3. Exatamente 4 subtítulos <h2> com palavras-chave relevantes para SEO.
4. NÃO mencione o site de origem do conteúdo.
5. NÃO inclua nenhuma tag <img> no conteúdo — a imagem de capa é inserida automaticamente pelo sistema.
6. NÃO inclua o <h1> no campo "content" — ele é renderizado separadamente pelo frontend.
7. O campo "content" deve conter apenas: parágrafos <p>, subtítulos <h2>, e listas <ul>/<li> quando apropriado.

FORMATO DE RETORNO — responda APENAS com JSON válido (sem blocos de código markdown, sem \`\`\`):
{
  "title": "Título reescrito, chamativo e com palavra-chave principal",
  "slug": "titulo-em-kebab-case-sem-acentos",
  "meta_description": "Descrição entre 150-160 caracteres com palavra-chave principal",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Uma de: Cinema, Séries, Marvel, DC, Lançamentos, Cultura Pop, Streaming, Anime",
  "content": "<p>Introdução impactante...</p><h2>Subtítulo 1 com palavra-chave</h2><p>Conteúdo...</p><h2>Subtítulo 2</h2><p>Conteúdo...</p><h2>Subtítulo 3</h2><p>Conteúdo...</p><h2>Conclusão e Perspectivas</h2><p>Fechamento...</p>"
}

-- 
NOTÍCIA ORIGINAL:
Título: ${title}

Conteúdo:
${content.substring(0, 3000)}
`;

