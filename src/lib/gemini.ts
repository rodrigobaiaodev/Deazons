import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Gemini API key is not defined in environment variables');
}

export const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
  },
});

export const rewriteArticlePrompt = (
  title: string, 
  content: string, 
  imageUrl?: string | null,
  extraImageUrl1?: string | null,
  extraImageUrl2?: string | null
) => `
Você é um redator sênior de um portal de cultura nerd e entretenimento chamado "Deazons".
Eu fornecerei o título e conteúdo originais de um artigo de notícias sobre filmes/séries.

Você deve REESCREVER completamente tudo em português brasileiro para ser **100% original**, otimizado para SEO e não parecer uma cópia. Siga estritamente os REQUISITOS abaixo:

REQUISITOS AD-SENSE & SEO:
1. **Mínimo absoluto de 800 palavras**. Se o conteúdo original for curto, expanda significativamente com contexto histórico, filmografia, curiosidades de bastidores, impacto financeiro (bilheteria) e teorias sobre o futuro da franquia. O artigo deve ser exaustivo e autoritativo.
2. Seja engajador, opinativo e use um tom "nerd" e profissional.
3. **Pelo menos 4 "H2"** com subtítulos amigáveis.
4. **JAMAIS mencione o site de origem do conteúdo**.

REGRA DE IMAGENS E POSICIONAMENTO:
- Use a imagem principal (${imageUrl}) logo após o título H1.
- OBRIGATORIAMENTE, insira uma imagem adicional (${extraImageUrl1 || imageUrl}) logo após o primeiro subtítulo <h2>.
- OBRIGATORIAMENTE, insira uma imagem adicional (${extraImageUrl2 || imageUrl}) logo após o terceiro subtítulo <h2>.
- Todas as tags <img> devem ter o estilo: style="width:100%;max-width:800px;margin:20px 0;border-radius:12px;"

FORMATO DE RETORNO (JSON):
Gere APENAS O JSON (sem marcadores de markdown) contendo:
{
  "title": "[O novo título H1, reescrito]",
  "slug": "[O novo título em formato-kebab-case]",
  "meta_description": "[Descrição de 150-160 caracteres]",
  "tags": ["tag1", "tag2"],
  "category": "[Marvel, Cinema, Séries, Dicas, Lançamentos]",
  "content": "[O conteúdo HTML estruturado com H1, IMGs distribuídas, parágrafos e 4+ H2]"
}

-- 
NOTÍCIA ORIGINAL:
Título: ${title}

Conteúdo:
${content}
`;
