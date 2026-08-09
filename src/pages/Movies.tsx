
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMedia } from "@/hooks/useMedia";
import MediaFilters from "@/components/MediaFilters";
import MediaGrid from "@/components/MediaGrid";
import MediaPagination from "@/components/MediaPagination";
import SeoHead from "@/components/SeoHead";

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const genreId = searchParams.get("genre");
  const filterType = searchParams.get("filter");

  const { items, genres, totalPages, loading, error } = useMedia({
    type: "movie",
    genreId,
    filterType,
    currentPage,
  });

  const getFilterTitle = () => {
    if (filterType === "top_rated") {
      return "Filmes Mais Bem Avaliados";
    } else if (filterType === "upcoming") {
      return "Próximos Lançamentos";
    } else if (genreId) {
      const selectedGenre = genres.find(g => g.id.toString() === genreId);
      return selectedGenre ? `Filmes de ${selectedGenre.name}` : "Filmes por Gênero";
    } else {
      return "Filmes Populares";
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

  const seoTitle = getFilterTitle() + " | Deazons";
  const seoDesc = `Explore nossa coleção de ${getFilterTitle().toLowerCase()} no Deazons. Encontre trailers, elenco e onde assistir.`;
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: getFilterTitle(),
    itemListElement: items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://deazons.com/filmes/${item.id}-${(item.title || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")}`,
      name: item.title,
    })),
  };

  return (
    <div className="min-h-screen pb-10 pt-24">
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        canonicalOverride="https://deazons.com/filmes"
        jsonLd={listJsonLd}
      />
      <div className="container max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{getFilterTitle()}</h1>
          <MediaFilters
            genres={genres}
            onGenreChange={handleGenreChange}
            onFilterChange={handleFilterChange}
            selectedGenre={genreId}
            selectedFilter={filterType}
            type="movie"
          />
        </div>

        <MediaGrid
          items={items}
          type="movie"
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

export default Movies;
