
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Genre } from "@/services/tmdb";

interface MediaFiltersProps {
  genres: Genre[];
  onGenreChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  selectedGenre: string | null;
  selectedFilter: string | null;
  type: "movie" | "tv";
}

const MediaFilters = ({
  genres,
  onGenreChange,
  onFilterChange,
  selectedGenre,
  selectedFilter,
  type,
}: MediaFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={selectedFilter || "popular"}
        onValueChange={onFilterChange}
      >
        <SelectTrigger className="h-9 w-[200px] rounded-xl border-border/50 bg-card/80">
          <SelectValue placeholder="Filtrar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="popular">Popular</SelectItem>
          <SelectItem value="top_rated">Mais Bem Avaliados</SelectItem>
          <SelectItem value={type === "movie" ? "upcoming" : "on_the_air"}>
            {type === "movie" ? "Próximos Lançamentos" : "No Ar"}
          </SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={selectedGenre || "all"}
        onValueChange={onGenreChange}
      >
        <SelectTrigger className="h-9 w-[200px] rounded-xl border-border/50 bg-card/80">
          <SelectValue placeholder="Gênero" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Gêneros</SelectItem>
          {genres.map((genre) => (
            <SelectItem key={genre.id} value={genre.id.toString()}>
              {genre.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MediaFilters;
