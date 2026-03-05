/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  tmdbAPI, 
  PersonDetails as PersonDetailsType,
  Movie,
  TVShow
} from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";
import MediaGrid from "@/components/MediaGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Film, Tv, ArrowLeft } from "lucide-react";
import NotFound from "./NotFound";

const PersonFilmography = () => {
  const { id, mediaType } = useParams<{ id: string; mediaType: string }>();
  const { toast } = useToast();
  const [person, setPerson] = useState<PersonDetailsType | null>(null);
  const [movieCredits, setMovieCredits] = useState<{ cast: Movie[]; crew: Movie[] } | null>(null);
  const [tvCredits, setTVCredits] = useState<{ cast: TVShow[]; crew: TVShow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  const activeTab = mediaType === "tv" ? "tv" : "movies";
  
  useEffect(() => {
    const fetchPersonData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        
        const personId = parseInt(id);
        
        const [personData, personMovieCredits, personTVCredits] = await Promise.all([
          tmdbAPI.getPersonDetails(personId),
          tmdbAPI.getPersonMovieCredits(personId),
          tmdbAPI.getPersonTVCredits(personId),
        ]);
        
        setPerson(personData);
        setMovieCredits(personMovieCredits);
        setTVCredits(personTVCredits);
      } catch (err) {
        console.error("Error fetching person filmography:", err);
        
        if ((err as any)?.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError("Ocorreu um erro ao carregar os dados da pessoa. Por favor, tente novamente.");
          toast({
            variant: "destructive", 
            title: "Erro",
            description: "Não foi possível carregar os dados da filmografia. Tente novamente mais tarde.",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonData();
  }, [id, toast]);
  
  // Helpers for sorting credits by popularity
  const sortMoviesByPopularity = (movies: Movie[]) => {
    return [...movies].sort((a, b) => b.popularity - a.popularity);
  };
  
  const sortTVShowsByPopularity = (shows: TVShow[]) => {
    return [...shows].sort((a, b) => b.popularity - a.popularity);
  };

  if (notFound) {
    return <NotFound />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-2xl text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild>
          <Link to="/">Voltar para Home</Link>
        </Button>
      </div>
    );
  }

  // Sort credits by popularity
  const sortedMovieCast = movieCredits?.cast ? sortMoviesByPopularity(movieCredits.cast) : [];
  const sortedTVCast = tvCredits?.cast ? sortTVShowsByPopularity(tvCredits.cast) : [];

  return (
    <div className="min-h-screen pb-10 pt-24">
      <div className="container">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link to={`/people/${id}`}>
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">
            {person?.name ? `Filmografia de ${person.name}` : 'Filmografia'}
          </h1>
        </div>

        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger
              value="movies"
              className="flex items-center gap-2"
              asChild
            >
              <Link to={`/people/${id}/movies`}>
                <Film size={16} />
                Filmes {movieCredits?.cast?.length ? `(${movieCredits.cast.length})` : ''}
              </Link>
            </TabsTrigger>
            <TabsTrigger
              value="tv"
              className="flex items-center gap-2"
              asChild
            >
              <Link to={`/people/${id}/tv`}>
                <Tv size={16} />
                Séries {tvCredits?.cast?.length ? `(${tvCredits.cast.length})` : ''}
              </Link>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="movies" className="mt-0">
            <MediaGrid
              items={sortedMovieCast}
              type="movie"
              loading={loading}
              error={error}
              onRetry={() => window.location.reload()}
              onClearFilters={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="tv" className="mt-0">
            <MediaGrid
              items={sortedTVCast}
              type="tv"
              loading={loading}
              error={error}
              onRetry={() => window.location.reload()}
              onClearFilters={() => {}}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PersonFilmography;
