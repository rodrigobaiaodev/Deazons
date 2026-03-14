
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-deazon-600">404</h1>
        <p className="text-xl text-muted-foreground mt-4 mb-6">
          Oops! Parece que esta página não existe.
        </p>
        <p className="mb-8 text-muted-foreground">
          A página que você está procurando foi removida, renomeada ou talvez nunca tenha existido.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/">Voltar para Home</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/pesquisa">Buscar Conteúdo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
