/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { tmdbAPI, Movie, TVShow, Person } from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import PersonCard from "@/components/PersonCard";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search when query changes
  useEffect(() => {
    const searchQuery = searchParams.get("q");
    
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = async (searchQuery: string, page: number) => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await tmdbAPI.searchMulti(searchQuery, page);
      
      // Separate results by type
      const movieResults: Movie[] = [];
      const tvResults: TVShow[] = [];
      const peopleResults: Person[] = [];
      
      searchResults.results.forEach((item: any) => {
        if (item.media_type === "movie") {
          movieResults.push(item as Movie);
        } else if (item.media_type === "tv") {
          tvResults.push(item as TVShow);
        } else if (item.media_type === "person") {
          peopleResults.push(item as Person);
        }
      });
      
      setMovies(movieResults);
      setTVShows(tvResults);
      setPeople(peopleResults);
      setCurrentPage(page);
      setTotalPages(searchResults.total_pages > 20 ? 20 : searchResults.total_pages); // Limit to 20 pages
    } catch (err) {
      console.error("Error performing search:", err);
      setError("Ocorreu um erro ao realizar a busca. Por favor, tente novamente.");
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível completar sua busca. Tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const loadPage = (page: number) => {
    const searchQuery = searchParams.get("q") || "";
    performSearch(searchQuery, page);
  };

  // Calculate total results
  const totalResults = movies.length + tvShows.length + people.length;

  return (
    <div className="min-h-screen pb-10 pt-24">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Busca</h1>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                placeholder="Filmes, séries, atores..."
              />
            </div>
            <Button type="submit" disabled={loading}>Buscar</Button>
          </div>
        </form>
        
        {/* Search results */}
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-pulse text-xl text-muted-foreground">Buscando...</div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => performSearch(query, 1)}>Tentar novamente</Button>
          </div>
        ) : query && totalResults === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl mb-2">Nenhum resultado encontrado para "{query}"</p>
            <p className="text-muted-foreground">Tente outro termo de busca.</p>
          </div>
        ) : query ? (
          <div className="space-y-8">
            <p className="text-muted-foreground">
              Encontrados {totalResults} resultados para "{query}"
            </p>
            
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-4"
            >
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="movies">Filmes ({movies.length})</TabsTrigger>
                <TabsTrigger value="tv">Séries ({tvShows.length})</TabsTrigger>
                <TabsTrigger value="people">Pessoas ({people.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-8">
                {/* Movies section */}
                {movies.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Filmes</h2>
                      {movies.length > 6 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("movies")}
                          className="text-deazon-400 hover:text-deazon-300"
                        >
                          Ver todos
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {movies.slice(0, 6).map((movie) => (
                        <MediaCard key={movie.id} media={movie} type="movie" />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* TV Shows section */}
                {tvShows.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Séries</h2>
                      {tvShows.length > 6 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("tv")}
                          className="text-deazon-400 hover:text-deazon-300"
                        >
                          Ver todas
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {tvShows.slice(0, 6).map((show) => (
                        <MediaCard key={show.id} media={show} type="tv" />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* People section */}
                {people.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Pessoas</h2>
                      {people.length > 6 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("people")}
                          className="text-deazon-400 hover:text-deazon-300"
                        >
                          Ver todas
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {people.slice(0, 6).map((person) => (
                        <PersonCard key={person.id} person={person} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="movies">
                <h2 className="text-xl font-semibold mb-4">Filmes</h2>
                {movies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {movies.map((movie) => (
                      <MediaCard key={movie.id} media={movie} type="movie" />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum filme encontrado.</p>
                )}
              </TabsContent>
              
              <TabsContent value="tv">
                <h2 className="text-xl font-semibold mb-4">Séries</h2>
                {tvShows.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tvShows.map((show) => (
                      <MediaCard key={show.id} media={show} type="tv" />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma série encontrada.</p>
                )}
              </TabsContent>
              
              <TabsContent value="people">
                <h2 className="text-xl font-semibold mb-4">Pessoas</h2>
                {people.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {people.map((person) => (
                      <PersonCard key={person.id} person={person} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma pessoa encontrada.</p>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => loadPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  
                  <span className="flex items-center px-4 text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => loadPage(currentPage + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Search;
