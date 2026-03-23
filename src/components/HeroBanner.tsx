
import { Movie } from "@/services/tmdb";
import { getImageUrl, BACKDROP_SIZES } from "@/services/tmdb";
import { Button } from "@/components/ui/button";
import { Info, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroBannerProps {
  movie: Movie;
}

const HeroBanner = ({ movie }: HeroBannerProps) => {
  const backdropUrl = getImageUrl(movie.backdrop_path, BACKDROP_SIZES.ORIGINAL);
  
  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] overflow-hidden bg-background">
      {/* Backdrop Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center md:bg-top opacity-60 scale-105 animate-in fade-in duration-1000 zoom-in-105"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />

      {/* Premium Gradient Overlays */}
      <div className="absolute inset-y-0 left-0 w-full md:w-3/4 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 h-full container flex flex-col justify-end pb-16 md:pb-28 pl-4 sm:pl-8 md:pl-10">
        <div className="max-w-2xl lg:max-w-3xl animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-md">
              Destaque do Dia
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[1.1] tracking-tighter drop-shadow-xl">
            {movie.title}
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-white/80 mb-8 line-clamp-3 leading-relaxed font-light max-w-2xl drop-shadow-lg">
            {movie.overview}
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 gap-3 rounded-full font-bold px-8 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 text-base"
            >
              <Link to={`/filmes/${movie.id}`}>
                <Play size={20} fill="currentColor" />
                Assistir Agora
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 gap-2 rounded-full font-bold border-white/20 bg-white/5 backdrop-blur-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300 px-8 text-white text-base"
            >
              <Link to={`/filmes/${movie.id}`}>
                <Info size={20} />
                Mais Detalhes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
