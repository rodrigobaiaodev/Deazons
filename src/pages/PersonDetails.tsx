/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  tmdbAPI, 
  PersonDetails as PersonDetailsType,
  Movie,
  TVShow,
  getImageUrl,
  PROFILE_SIZES
} from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaRow from "@/components/MediaRow";
import { Film, Tv, Calendar, MapPin } from "lucide-react";
import NotFound from "./NotFound";

const PersonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [person, setPerson] = useState<PersonDetailsType | null>(null);
  const [movieCredits, setMovieCredits] = useState<{ cast: Movie[]; crew: Movie[] } | null>(null);
  const [tvCredits, setTVCredits] = useState<{ cast: TVShow[]; crew: TVShow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    const fetchPersonDetails = async () => {
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
        console.error("Error fetching person details:", err);
        
        if ((err as any)?.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError("An error occurred while loading person data. Please try again.");
          toast({
            variant: "destructive", 
            title: "Error",
            description: "Failed to load person details. Please try again later.",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonDetails();
  }, [id, toast]);
  
  // Helper functions
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };
  
  const calculateAge = (birthday: string | null, deathday: string | null) => {
    if (!birthday) return null;
    
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const sortMoviesByPopularity = (movies: Movie[]) => {
    return [...movies].sort((a, b) => b.popularity - a.popularity);
  };
  
  const sortTVShowsByPopularity = (shows: TVShow[]) => {
    return [...shows].sort((a, b) => b.popularity - a.popularity);
  };

  if (notFound) {
    return <NotFound />;
  }

  if (loading && !person) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-2xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error && !person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  if (!person) return null;

  const age = calculateAge(person.birthday, person.deathday);
  
  // Sort credits by popularity
  const sortedMovieCast = movieCredits?.cast ? sortMoviesByPopularity(movieCredits.cast) : [];
  const sortedTVCast = tvCredits?.cast ? sortTVShowsByPopularity(tvCredits.cast) : [];

  return (
    <div className="min-h-screen pb-10 pt-24">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar with person image and info */}
          <div className="space-y-6">
            <div className="rounded-lg overflow-hidden">
              <img 
                src={getImageUrl(person.profile_path, PROFILE_SIZES.LARGE)} 
                alt={person.name}
                className="w-full object-cover"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              
              <div className="space-y-3">
                {person.known_for_department && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Known For</h3>
                    <p>{person.known_for_department}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                  <p>{person.gender === 1 ? "Female" : person.gender === 2 ? "Male" : "Not specified"}</p>
                </div>
                
                {person.birthday && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Birthday
                      </span>
                    </h3>
                    <p>
                      {formatDate(person.birthday)}
                      {age !== null && !person.deathday && <span className="text-muted-foreground"> ({age} years old)</span>}
                    </p>
                  </div>
                )}
                
                {person.deathday && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Death</h3>
                    <p>
                      {formatDate(person.deathday)}
                      {age !== null && <span className="text-muted-foreground"> ({age} years old)</span>}
                    </p>
                  </div>
                )}
                
                {person.place_of_birth && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        Place of Birth
                      </span>
                    </h3>
                    <p>{person.place_of_birth}</p>
                  </div>
                )}
                
                {person.also_known_as.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Also Known As</h3>
                    <div>
                      {person.also_known_as.map((name, i) => (
                        <p key={i} className="text-sm">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{person.name}</h1>
              
              {person.biography && (
                <div className="mt-6 space-y-4">
                  <h2 className="text-2xl font-semibold">Biography</h2>
                  <div className="text-muted-foreground space-y-3">
                    {person.biography.split('\n\n').map((paragraph, i) => (
                      <p key={i}>{paragraph || "No biography available."}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Filmography tabs */}
            <Tabs defaultValue="movies" className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Filmography</h2>
                <TabsList>
                  <TabsTrigger value="movies" className="flex items-center gap-2">
                    <Film size={16} />
                    Movies
                  </TabsTrigger>
                  <TabsTrigger value="tv" className="flex items-center gap-2">
                    <Tv size={16} />
                    TV
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="movies">
                {sortedMovieCast.length > 0 ? (
                  <>
                    <MediaRow
                      title="Movie Acting"
                      items={sortedMovieCast.slice(0, 20)}
                      type="movie"
                    />
                    
                    {sortedMovieCast.length > 20 && (
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to={`/people/${id}/movies`}>View all movies</Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No movies found for this person.</p>
                )}
              </TabsContent>
              
              <TabsContent value="tv">
                {sortedTVCast.length > 0 ? (
                  <>
                    <MediaRow
                      title="TV Acting"
                      items={sortedTVCast.slice(0, 20)}
                      type="tv"
                    />
                    
                    {sortedTVCast.length > 20 && (
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to={`/people/${id}/tv`}>View all TV shows</Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No TV shows found for this person.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetails;
