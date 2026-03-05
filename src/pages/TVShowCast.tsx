/* eslint-disable @typescript-eslint/no-explicit-any */
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

const TVShowCast = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [showTitle, setShowTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchTVShowCast = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        
        const showId = parseInt(id);
        
        const [creditsData, showData] = await Promise.all([
          tmdbAPI.getTVShowCredits(showId),
          tmdbAPI.getTVShowDetails(showId),
        ]);
        
        setCredits(creditsData);
        setShowTitle(showData.name);
      } catch (err) {
        console.error("Error fetching TV show cast:", err);
        
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
    
    fetchTVShowCast();
  }, [id, toast]);

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
          <Link to={`/tvs/${id}`}>Back to TV Show</Link>
        </Button>
      </div>
    );
  }

  // Cast and crew from credits
  const cast = credits?.cast || [];
  const crew = credits?.crew || [];

  // Get all unique departments
  const departments = [...new Set(crew.map(person => person.department))].sort();

  return (
    <div className="min-h-screen pb-10 pt-24">
      <div className="container">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-3 gap-1">
            <Link to={`/tvs/${id}`}>
              <ArrowLeft size={16} />
              Back to TV Show
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            Cast & Crew
            <span className="text-muted-foreground ml-2">
              {showTitle}
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
                  to={`/people/${person.id}`}
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
                          to={`/people/${person.id}`}
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

export default TVShowCast;
