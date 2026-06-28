
import { useEffect, useState } from "react";
import { tmdbAPI, Movie, TVShow } from "@/services/tmdb";
import HeroBanner from "@/components/HeroBanner";
import MediaRow from "@/components/MediaRow";
import LatestTrailers from "@/components/LatestTrailers";
import HomeNewsSection from "@/components/HomeNewsSection";
import { useToast } from "@/components/ui/use-toast";
import SeoHead from "@/components/SeoHead";
import { Link } from "react-router-dom";
import { blogPosts } from "@/blog/data/posts";
import imagesDataRaw from "@/blog/data/images.json";
import { CalendarDays, BookOpen } from "lucide-react";

const imagesData = imagesDataRaw as Record<string, { url: string; alt: string; photographer: string }[]>;

const Home = () => {
  const { toast } = useToast();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        const [
          trendingData,
          popularMoviesData,
          topRatedMoviesData,
          upcomingMoviesData,
          popularTVData,
          topRatedTVData,
        ] = await Promise.all([
          tmdbAPI.getTrending("day"),
          tmdbAPI.getPopularMovies(),
          tmdbAPI.getTopRatedMovies(),
          tmdbAPI.getUpcomingMovies(),
          tmdbAPI.getPopularTVShows(),
          tmdbAPI.getTopRatedTVShows(),
        ]);

        setTrendingMovies(trendingData.results);
        setPopularMovies(popularMoviesData.results);
        setTopRatedMovies(topRatedMoviesData.results);
        setUpcomingMovies(upcomingMoviesData.results);
        setPopularTVShows(popularTVData.results);
        setTopRatedTVShows(topRatedTVData.results);
      } catch (err) {
        console.error("Error fetching home data:", err);
        setError("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os conteúdos. Tente novamente mais tarde.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [toast]);

  if (loading && !trendingMovies.length) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-2xl text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-background min-h-screen">
      <SeoHead
        title="Deazons | Filmes, Séries e Notícias de Entretenimento"
        description="Descubra informações sobre milhares de filmes, séries e atores no Deazons - seu portal completo de entretenimento com notícias, trailers e onde assistir."
        canonicalOverride="https://deazons.com/"
      />
      {trendingMovies.length > 0 && <HeroBanner movie={trendingMovies[0]} />}
      
      <div className="container space-y-4 md:space-y-8 pt-10">
        {trendingMovies.length > 0 && (
          <MediaRow
            title="Em Alta Hoje"
            items={trendingMovies}
            type="movie"
            seeAllLink="/filmes"
          />
        )}
        
        {popularMovies.length > 0 && (
          <MediaRow
            title="Filmes Populares"
            items={popularMovies}
            type="movie"
            seeAllLink="/filmes"
          />
        )}
        
        {topRatedMovies.length > 0 && (
          <MediaRow
            title="Filmes Aclamados Pela Crítica"
            items={topRatedMovies}
            type="movie"
            seeAllLink="/filmes?filter=top_rated"
          />
        )}
        
        {upcomingMovies.length > 0 && (
          <MediaRow
            title="Próximos Lançamentos (Filmes)"
            items={upcomingMovies}
            type="movie"
            seeAllLink="/filmes?filter=upcoming"
          />
        )}

        <LatestTrailers />

        <HomeNewsSection />

        {popularTVShows.length > 0 && (
          <MediaRow
            title="Séries que Todo Mundo Está Assistindo"
            items={popularTVShows}
            type="tv"
            seeAllLink="/series"
          />
        )}
        
        {topRatedTVShows.length > 0 && (
          <MediaRow
            title="Séries Mais Aclamadas"
            items={topRatedTVShows}
            type="tv"
            seeAllLink="/series?filter=top_rated"
          />
        )}

        <section className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Artigos & Guias
            </h2>
            <Link to="/blog" className="text-sm font-medium text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.slice(0, 6).map(post => {
              const coverImage = (imagesData[post.slug] || [])[0]?.url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2670&auto=format&fit=crop";
              return (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </time>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
