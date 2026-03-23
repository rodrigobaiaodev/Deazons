
import { useEffect, useState } from "react";
import { tmdbAPI, Movie, TVShow } from "@/services/tmdb";
import HeroBanner from "@/components/HeroBanner";
import MediaRow from "@/components/MediaRow";
import LatestTrailers from "@/components/LatestTrailers";
import { useToast } from "@/components/ui/use-toast";

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
      </div>
    </div>
  );
};

export default Home;
