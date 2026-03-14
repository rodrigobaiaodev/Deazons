
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  tmdbAPI, 
  MovieDetails as MovieDetailsType, 
  Credits,
  Video,
  Movie,
  getImageUrl,
  BACKDROP_SIZES,
  POSTER_SIZES
} from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaRow from "@/components/MediaRow";
import TrailerModal from "@/components/TrailerModal";
import WatchProviders from "@/components/WatchProviders";
import { Play, Star, Calendar, Clock, Users, DollarSign } from "lucide-react";
import NotFound from "./NotFound";
import { extractId, moviePath } from "@/lib/slug";

const MovieDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        
        const movieId = extractId(slug);
        
        const [movieData, creditsData, videosData, similarData] = await Promise.all([
          tmdbAPI.getMovieDetails(movieId),
          tmdbAPI.getMovieCredits(movieId),
          tmdbAPI.getMovieVideos(movieId),
          tmdbAPI.getSimilarMovies(movieId),
        ]);
        
        setMovie(movieData);
        setCredits(creditsData);
        setVideos(videosData.results);
        setSimilarMovies(similarData.results);

        // Redirect to slug URL if not already there
        const expectedSlug = moviePath(movieData.id, movieData.title).replace("/filmes/", "");
        if (slug !== expectedSlug) {
          navigate(moviePath(movieData.id, movieData.title), { replace: true });
        }
      } catch (err) {
        console.error("Error fetching movie details:", err);
        if ((err as any)?.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError("Ocorreu um erro ao carregar os dados do filme. Por favor, tente novamente.");
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível carregar os detalhes do filme. Tente novamente mais tarde.",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovieDetails();
  }, [slug, toast, navigate]);
  
  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric", month: "short", day: "numeric",
    }).format(new Date(dateStr));
  };
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);

  const getTrailer = () => {
    return (
      videos.find(v => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
      videos.find(v => v.site === "YouTube")
    );
  };

  if (notFound) return <NotFound />;

  if (loading && !movie) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-2xl text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error && !movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild><Link to="/">Voltar ao Início</Link></Button>
      </div>
    );
  }

  if (!movie) return null;

  const trailer = getTrailer();
  const cast = credits?.cast?.slice(0, 10) || [];
  const directors = credits?.crew?.filter(p => p.job === "Director") || [];
  const movieId = extractId(slug!);

  return (
    <div className="min-h-screen pb-10 pt-16">
      {/* Trailer Modal */}
      {trailerOpen && trailer && (
        <TrailerModal
          videoKey={trailer.key}
          title={`${movie.title} – Trailer`}
          onClose={() => setTrailerOpen(false)}
        />
      )}

      {/* Backdrop */}
      <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${getImageUrl(movie.backdrop_path, BACKDROP_SIZES.ORIGINAL)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />

        <div className="relative container z-10 h-full flex items-end pb-10 md:pb-14">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full">
            {/* Poster */}
            <div className="hidden md:block flex-shrink-0 w-48 lg:w-60">
              <img
                src={getImageUrl(movie.poster_path, POSTER_SIZES.MEDIUM)}
                alt={movie.title}
                className="w-full rounded-xl overflow-hidden shadow-2xl border border-white/10"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                {movie.title}
                {movie.release_date && (
                  <span className="text-muted-foreground font-normal ml-3 text-2xl">
                    ({new Date(movie.release_date).getFullYear()})
                  </span>
                )}
              </h1>
              
              {movie.tagline && (
                <p className="text-base italic text-muted-foreground mt-2">"{movie.tagline}"</p>
              )}
              
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-muted-foreground">/ 10</span>
                  </div>
                )}
                {movie.release_date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span>{formatDate(movie.release_date)}</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14} />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
              </div>
              
              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres?.map(genre => (
                  <Link key={genre.id} to={`/filmes?genre=${genre.id}`}>
                    <Badge variant="secondary" className="rounded-full hover:bg-primary hover:text-white transition-colors">
                      {genre.name}
                    </Badge>
                  </Link>
                ))}
              </div>
              
              {/* Trailer button */}
              {trailer && (
                <div className="mt-6">
                  <Button
                    onClick={() => setTrailerOpen(true)}
                    className="gap-2 rounded-xl font-semibold px-6 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                    size="lg"
                  >
                    <Play size={18} fill="currentColor" />
                    Ver Trailer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mt-8 md:mt-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 lg:gap-10">
          {/* Main column */}
          <div>
            <Tabs defaultValue="overview">
              <TabsList className="mb-6 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg">Visão Geral</TabsTrigger>
                <TabsTrigger value="cast" className="rounded-lg">Elenco</TabsTrigger>
                <TabsTrigger value="videos" className="rounded-lg">Vídeos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-8">
                {/* Synopsis */}
                <div>
                  <h2 className="text-2xl font-bold mb-3">Sinopse</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.overview || "Sinopse não disponível."}
                  </p>
                </div>
                
                {/* Details */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Detalhes</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {directors.length > 0 && (
                      <div className="bg-card/50 rounded-xl p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Diretor</dt>
                        <dd>
                          {directors.map((d, i) => (
                            <span key={d.id}>
                              <Link to={`/pessoas/${d.id}`} className="hover:text-primary transition-colors font-medium">
                                {d.name}
                              </Link>
                              {i < directors.length - 1 && ", "}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    
                    <div className="bg-card/50 rounded-xl p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</dt>
                      <dd className="font-medium">{movie.status}</dd>
                    </div>

                    {movie.runtime && movie.runtime > 0 && (
                      <div className="bg-card/50 rounded-xl p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Duração</dt>
                        <dd className="font-medium">{formatRuntime(movie.runtime)}</dd>
                      </div>
                    )}
                    
                    {movie.budget > 0 && (
                      <div className="bg-card/50 rounded-xl p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Orçamento</dt>
                        <dd className="font-medium">{formatCurrency(movie.budget)}</dd>
                      </div>
                    )}
                    
                    {movie.revenue > 0 && (
                      <div className="bg-card/50 rounded-xl p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Receita</dt>
                        <dd className="font-medium">{formatCurrency(movie.revenue)}</dd>
                      </div>
                    )}
                    
                    {movie.production_countries.length > 0 && (
                      <div className="bg-card/50 rounded-xl p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">País de Origem</dt>
                        <dd className="font-medium">{movie.production_countries.map(c => c.name).join(", ")}</dd>
                      </div>
                    )}
                    
                    {movie.spoken_languages.length > 0 && (
                      <div className="bg-card/50 rounded-xl p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Idiomas</dt>
                        <dd className="font-medium">{movie.spoken_languages.map(l => l.name || l.english_name).join(", ")}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </TabsContent>
              
              <TabsContent value="cast">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users size={20} /> Elenco
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {cast.length > 0 ? (
                    cast.map(person => (
                      <Link key={person.id} to={`/pessoas/${person.id}`} className="block group">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-card">
                          <img
                            src={getImageUrl(person.profile_path, "w185")}
                            alt={person.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2">
                          <h4 className="font-semibold text-sm">{person.name}</h4>
                          <p className="text-xs text-muted-foreground">{person.character}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full">Sem dados de elenco.</p>
                  )}
                </div>
                <div className="mt-6">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to={`/filmes/${slug}/cast`}>Ver elenco completo</Link>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="videos">
                <h2 className="text-2xl font-bold mb-4">Vídeos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.length > 0 ? (
                    videos.filter(v => v.site === "YouTube").map(video => (
                      <div key={video.id} className="space-y-2">
                        <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.key}`}
                            title={video.name}
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                        <h4 className="font-semibold text-sm">{video.name}</h4>
                        <p className="text-xs text-muted-foreground">{video.type}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full">Sem vídeos disponíveis.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Elenco Principal */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Elenco Principal</h3>
                <Link to={`/filmes/${slug}/cast`} className="text-xs font-semibold text-primary hover:text-primary/80 uppercase tracking-wider">
                  Ver todos
                </Link>
              </div>
              <div className="space-y-3">
                {cast.slice(0, 5).map(person => (
                  <Link
                    key={person.id}
                    to={`/pessoas/${person.id}`}
                    className="flex items-center gap-3 hover:bg-accent/50 p-2 -mx-2 rounded-xl transition-colors"
                  >
                    <img
                      src={getImageUrl(person.profile_path, "w45")}
                      alt={person.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-border/40"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="font-semibold text-sm">{person.name}</h4>
                      <p className="text-xs text-muted-foreground">{person.character}</p>
                    </div>
                  </Link>
                ))}
                {cast.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem dados de elenco.</p>
                )}
              </div>
            </div>
            
            <Separator />

            {/* Onde Assistir */}
            <WatchProviders mediaId={movieId} mediaType="movie" />

            <Separator />

            {/* Produtoras */}
            {movie.production_companies.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">Produtoras</h3>
                <div className="space-y-4">
                  {movie.production_companies.slice(0, 3).map(company => (
                    <div key={company.id} className="flex items-center gap-3">
                      {company.logo_path ? (
                        <img
                          src={getImageUrl(company.logo_path, "w92")}
                          alt={company.name}
                          className="h-8 max-w-[5rem] object-contain bg-white/90 p-1 rounded-md"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-muted/40 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">{company.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm font-medium">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Filmes Similares */}
        {similarMovies.length > 0 && (
          <div className="mt-10">
            <MediaRow title="Filmes Similares" items={similarMovies} type="movie" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;
