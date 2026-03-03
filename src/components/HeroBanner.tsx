
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
    <div className="relative w-full h-[55vh] md:h-[75vh] overflow-hidden">
      {/* Backdrop Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />

      {/* Triple gradient overlay for maximum readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 h-full container flex flex-col justify-end pb-12 md:pb-20 pt-10">
        <div className="max-w-2xl">
          {/* Genre tag */}
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3 opacity-90">
            Em Destaque
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 animate-fade-in leading-tight tracking-tight">
            {movie.title}
          </h1>
          <p className="text-sm md:text-base text-white/70 mb-8 line-clamp-3 max-w-xl leading-relaxed">
            {movie.overview}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-xl font-semibold px-8 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
            >
              <Link to={`/movies/${movie.id}`}>
                <Play size={18} fill="currentColor" />
                Assistir
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 rounded-xl font-semibold border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/15 transition-all"
            >
              <Link to={`/movies/${movie.id}`}>
                <Info size={18} />
                Detalhes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
