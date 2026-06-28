import { Link } from "react-router-dom";

export default function MelhoresPlanosStreaming({ images }: { images: any[] }) {
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
