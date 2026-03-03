
import { cn } from "@/lib/utils";
import { Movie, TVShow } from "@/services/tmdb";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import MediaCard from "./MediaCard";
import { Link } from "react-router-dom";

interface MediaRowProps {
  title: string;
  items: (Movie | TVShow)[];
  type: "movie" | "tv";
  seeAllLink?: string;
  className?: string;
}

const MediaRow = ({ title, items, type, seeAllLink, className }: MediaRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    
    const newScrollLeft = direction === "left" 
      ? scrollLeft - scrollAmount 
      : scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    setTimeout(() => {
      if (!scrollRef.current) return;
      setShowLeftArrow(scrollRef.current.scrollLeft > 0);
      setShowRightArrow(
        scrollRef.current.scrollLeft + scrollRef.current.clientWidth < scrollRef.current.scrollWidth - 10
      );
    }, 300);
  };

  if (!items?.length) return null;

  return (
    <section className={cn("py-8", className)}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold md:text-2xl tracking-tight">{title}</h2>
        {seeAllLink && (
          <Link 
            to={seeAllLink} 
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
          >
            Ver todos →
          </Link>
        )}
      </div>
      
      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-black/70 hover:bg-primary rounded-full p-2 ml-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
            aria-label="Rolar para a esquerda"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          onScroll={() => {
            if (!scrollRef.current) return;
            setShowLeftArrow(scrollRef.current.scrollLeft > 0);
            setShowRightArrow(
              scrollRef.current.scrollLeft + scrollRef.current.clientWidth < scrollRef.current.scrollWidth - 10
            );
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[185px]"
            >
              <MediaCard media={item} type={type} />
            </div>
          ))}
        </div>
        
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-black/70 hover:bg-primary rounded-full p-2 mr-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
            aria-label="Rolar para a direita"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
};

export default MediaRow;
