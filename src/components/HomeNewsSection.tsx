import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, TrendingUp, ArrowRight, Newspaper } from "lucide-react";
import { supabase, Article } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  imageUrl: string;
}

const mapArticle = (item: Article): NewsArticle => ({
  id: item.slug,
  title: item.title,
  summary: item.meta_description || item.content.substring(0, 120) + "...",
  category: item.category || "Notícia",
  date: new Date(item.published_at || item.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  imageUrl:
    item.image_url ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2670&auto=format&fit=crop",
});

/* ── Skeleton ── */
const SkeletonFeatured = () => (
  <div className="relative rounded-2xl overflow-hidden bg-white/5 animate-pulse aspect-[16/9] md:aspect-[2/1]" />
);

const SkeletonSmall = () => (
  <div className="flex gap-3 items-start animate-pulse">
    <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-white/5" />
    <div className="flex-1 flex flex-col gap-2 pt-1">
      <div className="h-3 w-16 rounded bg-white/5" />
      <div className="h-4 w-full rounded bg-white/5" />
      <div className="h-4 w-4/5 rounded bg-white/5" />
    </div>
  </div>
);

/* ── Main component ── */
const HomeNewsSection = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(7);

      if (data && !error) {
        setArticles(data.map(mapArticle));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // Don't render section if no articles and not loading
  if (!loading && articles.length === 0) return null;

  const featured = articles[0];
  const secondary = articles.slice(1, 4);
  const sidebar = articles.slice(4, 7);

  return (
    <section className="py-10" aria-labelledby="home-news-heading">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 border border-primary/30">
            <Newspaper className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2
              id="home-news-heading"
              className="text-2xl font-bold tracking-tight leading-none"
            >
              Notícias & Artigos
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cinema, séries e cultura pop em destaque
            </p>
          </div>
        </div>
        <Link
          to="/noticias"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
        >
          Ver todas
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Featured + Secondary ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Featured card */}
          {loading ? (
            <SkeletonFeatured />
          ) : featured ? (
            <Link
              to={`/noticias/${featured.id}`}
              className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 block"
            >
              <div className="relative aspect-[16/9] md:aspect-[2/1] bg-black overflow-hidden">
                <img
                  src={featured.imageUrl}
                  alt={featured.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <Badge className="mb-3 bg-primary/90 hover:bg-primary border-none text-xs uppercase tracking-wide font-semibold shadow-lg">
                    {featured.category}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-extrabold leading-snug text-white group-hover:text-primary transition-colors line-clamp-2">
                    {featured.title}
                  </h3>
                  <p className="text-sm text-white/70 mt-2 line-clamp-2 hidden md:block">
                    {featured.summary}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-white/50 mt-3">
                    <Clock className="w-3.5 h-3.5" />
                    <time>{featured.date}</time>
                  </div>
                </div>
              </div>
            </Link>
          ) : null}

          {/* Secondary row — 3 smaller horizontal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden bg-white/5 animate-pulse aspect-video"
                  />
                ))
              : secondary.map((article) => (
                  <Link
                    key={article.id}
                    to={`/noticias/${article.id}`}
                    className="group flex flex-col rounded-xl overflow-hidden border border-white/8 hover:border-primary/30 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-2 left-2 bg-black/70 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white/80 text-[10px] font-medium uppercase tracking-wide">
                        {article.category}
                      </Badge>
                    </div>
                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-auto pt-1">
                        <Clock className="w-3 h-3" />
                        <time>{article.date}</time>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        {/* ── Right Sidebar: list of articles ── */}
        <div className="flex flex-col gap-0 rounded-2xl border border-white/8 bg-card overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8 bg-white/3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Em Alta
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonSmall key={i} />
              ))}
            </div>
          ) : sidebar.length > 0 ? (
            <div className="flex flex-col divide-y divide-white/6">
              {sidebar.map((article, idx) => (
                <Link
                  key={article.id}
                  to={`/noticias/${article.id}`}
                  className="group flex gap-3 items-start p-4 hover:bg-white/5 transition-colors duration-200"
                >
                  {/* Rank number */}
                  <span className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/10 text-muted-foreground mb-1.5 uppercase tracking-wide font-medium"
                    >
                      {article.category}
                    </Badge>
                    <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                      <Clock className="w-3 h-3" />
                      <time>{article.date}</time>
                    </div>
                  </div>
                  <img
                    src={article.imageUrl}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="flex-shrink-0 w-16 h-16 rounded-lg object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ))}
            </div>
          ) : null}

          {/* Sidebar footer CTA */}
          {!loading && (
            <div className="p-4 border-t border-white/8 mt-auto">
              <Link
                to="/noticias"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-sm font-semibold transition-all duration-200 group"
              >
                Ver todas as notícias
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile "ver todas" ── */}
      <div className="mt-5 sm:hidden">
        <Link
          to="/noticias"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-semibold transition-all"
        >
          Ver todas as notícias
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default HomeNewsSection;
