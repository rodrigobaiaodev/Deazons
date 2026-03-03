
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
      className={cn("movie-card block h-full bg-card overflow-hidden group", className)}
    >
      <div className="aspect-[2/3] overflow-hidden relative rounded-[15px]">
        <img 
          src={getImageUrl(media.poster_path, POSTER_SIZES.MEDIUM)} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Rating badge – top right corner, subtle */}
        {rating && (
          <div className="rating-badge">
            <Star size={10} className="fill-yellow-400 text-yellow-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Bottom overlay with title */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="font-semibold text-sm line-clamp-1 text-white leading-snug">
            {title}
          </h3>
          {year && (
            <span className="text-[11px] text-white/50 mt-0.5 block">{year}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MediaCard;
