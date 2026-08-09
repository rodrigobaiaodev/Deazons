/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link } from "react-router-dom";
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
import { Film, Tv, ArrowLeft } from "lucide-react";
import NotFound from "./NotFound";
import SeoHead from "@/components/SeoHead";
import { extractId, slugify } from "@/lib/slug";

const PersonFilmography = () => {
  const { id: idParam, mediaType } = useParams<{ id: string; mediaType: string }>();
  const personIdNum = idParam ? extractId(idParam) : NaN;
  const { toast } = useToast();
  const [person, setPerson] = useState<PersonDetailsType | null>(null);
  const [movieCredits, setMovieCredits] = useState<{ cast: Movie[]; crew: Movie[] } | null>(null);
  const [tvCredits, setTVCredits] = useState<{ cast: TVShow[]; crew: TVShow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  // Normalize legacy /filmes|/series paths to movie|tv
  const normalizedType =
    mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
  const activeTab = normalizedType === "tv" ? "tv" : "movies";
  
  useEffect(() => {
    const fetchPersonData = async () => {
      if (!idParam || Number.isNaN(personIdNum)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        
        const [personData, personMovieCredits, personTVCredits] = await Promise.all([
          tmdbAPI.getPersonDetails(personIdNum),
          tmdbAPI.getPersonMovieCredits(personIdNum),
          tmdbAPI.getPersonTVCredits(personIdNum),
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
  }, [idParam, personIdNum, toast]);
  
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

  const sortedMovieCast = movieCredits?.cast ? sortMoviesByPopularity(movieCredits.cast) : [];
  const sortedTVCast = tvCredits?.cast ? sortTVShowsByPopularity(tvCredits.cast) : [];
  const personSlug = person ? `${personIdNum}-${slugify(person.name)}` : String(personIdNum);
  const personUrl = `https://deazons.com/pessoas/${personSlug}`;
  const pageUrl = `${personUrl}/${normalizedType}`;
  const typeLabel = normalizedType === "tv" ? "séries" : "filmes";

  return (
    <div className="min-h-screen pb-10 pt-24">
      <SeoHead
        title={person ? `Filmografia de ${person.name} (${typeLabel}) | Deazons` : "Filmografia | Deazons"}
        description={
          person
            ? `Confira a filmografia completa com todos os ${typeLabel} de ${person.name} no Deazons.`
            : "Filmografia completa no Deazons."
        }
        canonicalOverride={pageUrl}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: "https://deazons.com/" },
            { "@type": "ListItem", position: 2, name: "Pessoas", item: "https://deazons.com/pessoas" },
            { "@type": "ListItem", position: 3, name: person?.name || "Pessoa", item: personUrl },
            { "@type": "ListItem", position: 4, name: typeLabel, item: pageUrl },
          ],
        }}
      />
      <div className="container">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link to={`/pessoas/${personSlug}`}>
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
              <Link to={`/pessoas/${personSlug}/movie`}>
                <Film size={16} />
                Filmes {movieCredits?.cast?.length ? `(${movieCredits.cast.length})` : ''}
              </Link>
            </TabsTrigger>
            <TabsTrigger
              value="tv"
              className="flex items-center gap-2"
              asChild
            >
              <Link to={`/pessoas/${personSlug}/tv`}>
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
