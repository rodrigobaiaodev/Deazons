
import { Movie, TVShow } from "@/services/tmdb";
import MediaCard from "./MediaCard";
import { Button } from "./ui/button";

interface MediaGridProps {
  items: (Movie | TVShow)[];
  type: "movie" | "tv";
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClearFilters: () => void;
}

const MediaGrid = ({ items, type, loading, error, onRetry, onClearFilters }: MediaGridProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-2xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-xl text-destructive">{error}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-xl mb-3">No {type === "movie" ? "movies" : "TV shows"} found</p>
        <p className="text-muted-foreground mb-6">Try adjusting your filters to find more results.</p>
        <Button onClick={onClearFilters}>Clear Filters</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {items.map((item) => (
        <MediaCard key={item.id} media={item} type={type} />
      ))}
    </div>
  );
};

export default MediaGrid;
