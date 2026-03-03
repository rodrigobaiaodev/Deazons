
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
    <div className="pb-10">
      {trendingMovies.length > 0 && <HeroBanner movie={trendingMovies[0]} />}
      
      <div className="container space-y-2 pt-8">
        {trendingMovies.length > 0 && (
          <MediaRow
            title="Em Alta"
            items={trendingMovies}
            type="movie"
            seeAllLink="/movies"
          />
        )}
        
        {popularMovies.length > 0 && (
          <MediaRow
            title="Filmes Populares"
            items={popularMovies}
            type="movie"
            seeAllLink="/movies"
          />
        )}
        
        {topRatedMovies.length > 0 && (
          <MediaRow
            title="Filmes Mais Bem Avaliados"
            items={topRatedMovies}
            type="movie"
            seeAllLink="/movies?filter=top_rated"
          />
        )}
        
        {upcomingMovies.length > 0 && (
          <MediaRow
            title="Próximos Lançamentos"
            items={upcomingMovies}
            type="movie"
            seeAllLink="/movies?filter=upcoming"
          />
        )}

        <LatestTrailers />

        {popularTVShows.length > 0 && (
          <MediaRow
            title="Séries Populares"
            items={popularTVShows}
            type="tv"
            seeAllLink="/tv"
          />
        )}
        
        {topRatedTVShows.length > 0 && (
          <MediaRow
            title="Séries Mais Bem Avaliadas"
            items={topRatedTVShows}
            type="tv"
            seeAllLink="/tv?filter=top_rated"
          />
        )}
      </div>
    </div>
  );
};

export default Home;
