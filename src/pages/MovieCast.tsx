/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  tmdbAPI, 
  Credits,
  getImageUrl
} from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NotFound from "./NotFound";
import SeoHead from "@/components/SeoHead";
import { extractId, moviePath } from "@/lib/slug";

const MovieCast = () => {
  const { slug } = useParams<{ slug: string }>();
  const movieId = slug ? extractId(slug) : NaN;
  const { toast } = useToast();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [movieTitle, setMovieTitle] = useState<string>("");
  const [movieSlugPath, setMovieSlugPath] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchMovieCast = async () => {
      if (!slug || Number.isNaN(movieId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        
        const [creditsData, movieData] = await Promise.all([
          tmdbAPI.getMovieCredits(movieId),
          tmdbAPI.getMovieDetails(movieId),
        ]);
        
        setCredits(creditsData);
        setMovieTitle(movieData.title);
        setMovieSlugPath(moviePath(movieId, movieData.title));
      } catch (err) {
        console.error("Error fetching movie cast:", err);
        
        if ((err as any)?.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError("Failed to load cast data. Please try again.");
          toast({
            variant: "destructive", 
            title: "Error",
            description: "Failed to load cast details. Please try again later.",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovieCast();
  }, [slug, movieId, toast]);

  if (notFound) {
    return <NotFound />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-2xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild>
          <Link to={movieSlugPath || `/filmes/${movieId}`}>Back to Movie</Link>
        </Button>
      </div>
    );
  }

  // Cast and crew from credits
  const cast = credits?.cast || [];
  const crew = credits?.crew || [];

  // Get all unique departments
  const departments = [...new Set(crew.map(person => person.department))].sort();
  const castUrl = `https://deazons.com${movieSlugPath}/cast`;

  return (
    <div className="min-h-screen pb-10 pt-24">
      <SeoHead
        title={`Elenco de ${movieTitle} | Deazons`}
        description={`Veja o elenco, atores, atrizes e equipe técnica do filme ${movieTitle} no Deazons.`}
        canonicalOverride={castUrl}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: "https://deazons.com/" },
            { "@type": "ListItem", position: 2, name: "Filmes", item: "https://deazons.com/filmes" },
            { "@type": "ListItem", position: 3, name: movieTitle, item: `https://deazons.com${movieSlugPath}` },
            { "@type": "ListItem", position: 4, name: "Elenco", item: castUrl },
          ],
        }}
      />
      <div className="container">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-3 gap-1">
            <Link to={movieSlugPath || `/filmes/${movieId}`}>
              <ArrowLeft size={16} />
              Back to Movie
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            Cast & Crew
            <span className="text-muted-foreground ml-2">
              {movieTitle}
            </span>
          </h1>
        </div>

        {/* Cast Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Cast</h2>
          {cast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {cast.map(person => (
                <Link 
                  key={person.id} 
                  to={`/pessoas/${person.id}`}
                  className="block group"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card">
                    <img
                      src={getImageUrl(person.profile_path, "w185")}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2">
                    <h4 className="font-medium text-sm">{person.name}</h4>
                    <p className="text-xs text-muted-foreground">{person.character}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No cast information available.</p>
          )}
        </div>

        {/* Crew Section - Organized by Department */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Crew</h2>
          {departments.length > 0 ? (
            <div className="space-y-8">
              {departments.map(department => {
                const departmentCrew = crew.filter(person => person.department === department);
                return (
                  <div key={department} className="space-y-4">
                    <h3 className="text-xl font-medium">{department}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {departmentCrew.map(person => (
                        <Link 
                          key={`${person.id}-${person.job}`} 
                          to={`/pessoas/${person.id}`}
                          className="block group"
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card">
                            <img
                              src={getImageUrl(person.profile_path, "w185")}
                              alt={person.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                          <div className="mt-2">
                            <h4 className="font-medium text-sm">{person.name}</h4>
                            <p className="text-xs text-muted-foreground">{person.job}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No crew information available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCast;
