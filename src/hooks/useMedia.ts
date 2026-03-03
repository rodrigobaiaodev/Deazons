
import { useState, useEffect } from "react";
import { tmdbAPI, Movie, TVShow, Genre } from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";

interface UseMediaProps {
  type: "movie" | "tv";
  genreId: string | null;
  filterType: string | null;
  currentPage: number;
}

export const useMedia = ({ type, genreId, filterType, currentPage }: UseMediaProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = type === "movie" 
          ? await tmdbAPI.getMovieGenres()
          : await tmdbAPI.getTVGenres();
        setGenres(response.genres);
      } catch (err) {
        console.error(`Error fetching ${type} genres:`, err);
      }
    };
    
    fetchGenres();
  }, [type]);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        
        if (type === "movie") {
          if (filterType === "top_rated") {
            response = await tmdbAPI.getTopRatedMovies(currentPage);
          } else if (filterType === "upcoming") {
            response = await tmdbAPI.getUpcomingMovies(currentPage);
          } else if (genreId) {
            response = await tmdbAPI.getMoviesByGenre(parseInt(genreId), currentPage);
          } else {
            response = await tmdbAPI.getPopularMovies(currentPage);
          }
        } else {
          if (filterType === "top_rated") {
            response = await tmdbAPI.getTopRatedTVShows(currentPage);
          } else if (filterType === "on_the_air") {
            response = await tmdbAPI.getOnTheAirTVShows(currentPage);
          } else if (genreId) {
            response = await tmdbAPI.getTVShowsByGenre(parseInt(genreId), currentPage);
          } else {
            response = await tmdbAPI.getPopularTVShows(currentPage);
          }
        }
        
        setItems(response.results);
        setTotalPages(Math.min(response.total_pages, 500));
        window.scrollTo(0, 0);
      } catch (err) {
        console.error(`Error fetching ${type}s:`, err);
        setError(`Ocorreu um erro ao carregar os ${type === "movie" ? "filmes" : "séries"}. Por favor, tente novamente.`);
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Não foi possível carregar a lista de ${type === "movie" ? "filmes" : "séries"}. Tente novamente mais tarde.`,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, [type, genreId, filterType, currentPage, toast]);

  return {
    items,
    genres,
    totalPages,
    loading,
    error,
  };
};
