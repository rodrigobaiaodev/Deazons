import { useState, useEffect } from "react";
import NewsCard, { NewsArticle } from "@/components/NewsCard";
import { supabase, Article } from "@/lib/supabase";

const NewsList = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data && !error) {
        // Mapeia para o formato que o NewsCard espera
        const formatted = data.map((item: Article) => ({
          id: item.slug,
          title: item.title,
          summary: item.meta_description || item.content.substring(0, 100) + "...",
          category: item.category || "Notícia",
          date: new Date(item.published_at || item.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }),
          imageUrl: item.image_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2670&auto=format&fit=crop",
        }));
        setNews(formatted);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <div className="min-h-screen pb-20 pt-24 bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Notícias e Artigos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Fique por dentro das últimas novidades do cinema, séries, e cultura pop. Atualizações diárias para você não perder nada.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="aspect-video bg-muted/50 animate-pulse" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                  <div className="h-6 w-full bg-muted/50 rounded animate-pulse" />
                  <div className="h-6 w-2/3 bg-muted/50 rounded animate-pulse" />
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Nenhuma notícia publicada ainda.
            </h2>
            <p className="text-muted-foreground mt-2">
              Volte mais tarde para conferir novas atualizações e furos sobre cultura pop!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsList;
