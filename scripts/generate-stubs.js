import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postsFilePath = path.join(__dirname, '../src/blog/data/posts.ts');
const postsFileContent = fs.readFileSync(postsFilePath, 'utf-8');

const regex = /componentName:\s*["']([^"']+)["']/g;
let match;
const names = [];

while ((match = regex.exec(postsFileContent)) !== null) {
  names.push(match[1]);
}

let createdCount = 0;

for (const name of names) {
  const filepath = path.join(__dirname, '../src/blog/posts', `${name}.tsx`);
  if (!fs.existsSync(filepath)) {
    const content = `import { Link } from "react-router-dom";

export default function ${name}({ images }: { images: any[] }) {
  return (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Artigo em Construção</h2>
      <p className="text-muted-foreground">Este conteúdo será publicado em breve. Fique ligado!</p>
      <Link to="/blog" className="text-primary hover:underline mt-8 inline-block">
        &larr; Voltar para o Blog
      </Link>
    </div>
  );
}
`;
    fs.writeFileSync(filepath, content);
    createdCount++;
  }
}

console.log(`✅ ${createdCount} stubs criados com sucesso.`);
