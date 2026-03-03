
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tmdbAPI, Person } from "@/services/tmdb";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import PersonCard from "@/components/PersonCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const People = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch people whenever page changes
    const fetchPeople = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const peopleResponse = await tmdbAPI.getPopularPeople(currentPage);
        
        setPeople(peopleResponse.results);
        setTotalPages(Math.min(peopleResponse.total_pages, 500)); // API usually limits to 500 pages
        
        // Scroll to top when page changes
        window.scrollTo(0, 0);
      } catch (err) {
        console.error("Error fetching people:", err);
        setError("Ocorreu um erro ao carregar a lista de pessoas. Por favor, tente novamente.");
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar a lista de pessoas. Tente novamente mais tarde.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPeople();
  }, [currentPage, toast]);
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen pb-10 pt-24">
      <div className="container max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Pessoas Populares</h1>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-2xl text-muted-foreground">Carregando...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <p className="text-xl text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        ) : people.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <p className="text-xl mb-3">Nenhuma pessoa encontrada</p>
            <Button onClick={() => setCurrentPage(1)}>Voltar para a primeira página</Button>
          </div>
        ) : (
          <>
            {/* People grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 2 && (
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </Button>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {currentPage > 3 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    
                    {/* Previous page */}
                    {currentPage > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        {currentPage - 1}
                      </Button>
                    )}
                    
                    {/* Current page */}
                    <Button variant="default" size="sm">
                      {currentPage}
                    </Button>
                    
                    {/* Next page */}
                    {currentPage < totalPages && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        {currentPage + 1}
                      </Button>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {currentPage < totalPages - 2 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    
                    {/* Last page */}
                    {currentPage < totalPages - 1 && (
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default People;
