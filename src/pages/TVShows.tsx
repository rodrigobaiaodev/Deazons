
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMedia } from "@/hooks/useMedia";
import MediaFilters from "@/components/MediaFilters";
import MediaGrid from "@/components/MediaGrid";
import MediaPagination from "@/components/MediaPagination";

const TVShows = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const genreId = searchParams.get("genre");
  const filterType = searchParams.get("filter");

  const { items, genres, totalPages, loading, error } = useMedia({
    type: "tv",
    genreId,
    filterType,
    currentPage,
  });

  const getFilterTitle = () => {
    if (filterType === "top_rated") {
      return "Séries Mais Bem Avaliadas";
    } else if (filterType === "on_the_air") {
      return "No Ar";
    } else if (genreId) {
      const selectedGenre = genres.find(g => g.id.toString() === genreId);
      return selectedGenre ? `Séries de ${selectedGenre.name}` : "Séries por Gênero";
    } else {
      return "Séries Populares";
    }
  };

  const handleGenreChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value !== "all") {
      params.set("genre", value);
    } else {
      params.delete("genre");
    }
    params.delete("filter");
    params.set("page", "1");
    setCurrentPage(1);
    setSearchParams(params);
  };

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value !== "popular") {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    params.delete("genre");
    params.set("page", "1");
    setCurrentPage(1);
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen pb-10 pt-24">
      <div className="container max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{getFilterTitle()}</h1>
          <MediaFilters
            genres={genres}
            onGenreChange={handleGenreChange}
            onFilterChange={handleFilterChange}
            selectedGenre={genreId}
            selectedFilter={filterType}
            type="tv"
          />
        </div>

        <MediaGrid
          items={items}
          type="tv"
          loading={loading}
          error={error}
          onRetry={() => window.location.reload()}
          onClearFilters={() => setSearchParams({})}
        />

        <MediaPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default TVShows;
