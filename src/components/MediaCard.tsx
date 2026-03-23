
import { Link } from "react-router-dom";
import { getImageUrl, POSTER_SIZES, Movie, TVShow } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { moviePath, tvPath } from "@/lib/slug";

interface MediaCardProps {
  media: Movie | TVShow;
  type: "movie" | "tv";
  className?: string;
}

const MediaCard = ({ media, type, className }: MediaCardProps) => {
  const title = type === "movie" 
    ? (media as Movie).title 
    : (media as TVShow).name;
    
  const date = type === "movie" 
    ? (media as Movie).release_date 
    : (media as TVShow).first_air_date;
    
  const year = date ? new Date(date).getFullYear() : "";
  
  const rating = media.vote_average ? media.vote_average.toFixed(1) : null;
  
  return (
    <Link 
      to={type === "movie" ? moviePath(media.id, (media as Movie).title) : tvPath(media.id, (media as TVShow).name)}
      className={cn("block h-full overflow-hidden group rounded-2xl transition-all duration-300 hover:ring-2 hover:ring-primary/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 bg-background", className)}
    >
      <div className="aspect-[2/3] relative rounded-2xl overflow-hidden bg-secondary w-full">
        <img 
          src={getImageUrl(media.poster_path, POSTER_SIZES.MEDIUM)} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Custom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300" />

        {/* Rating pill */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
            <Star size={12} className="fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-bold text-white tracking-wide">{rating}</span>
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="font-bold text-sm md:text-base line-clamp-2 text-white/90 leading-tight group-hover:text-primary transition-colors duration-300 drop-shadow-md">
            {title}
          </h3>
          {year && (
            <span className="text-xs text-white/60 mt-1 block font-medium tracking-wide">
              {year}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MediaCard;
