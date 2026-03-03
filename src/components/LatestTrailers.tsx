
import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { tmdbAPI, Movie, TVShow, Video } from "@/services/tmdb";
import { getImageUrl, BACKDROP_SIZES } from "@/services/tmdb";
import TrailerModal from "@/components/TrailerModal";

type FilterTab = "popular" | "streaming" | "tv" | "rent" | "cinemas";

interface TrailerItem {
  id: number;
  title: string;
  backdropPath: string | null;
  videoKey: string;
  videoName: string;
  mediaType: "movie" | "tv";
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "streaming", label: "Streaming" },
  { key: "tv", label: "Na TV" },
  { key: "rent", label: "Para Alugar" },
  { key: "cinemas", label: "Nos Cinemas" },
];

const LatestTrailers = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>("popular");
  const [trailers, setTrailers] = useState<TrailerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerItem | null>(null);

  useEffect(() => {
    const fetchTrailers = async () => {
      setLoading(true);
      setTrailers([]);

      try {
        let items: (Movie | TVShow)[] = [];
        let mediaType: "movie" | "tv" = "movie";

        if (activeTab === "popular") {
          const res = await tmdbAPI.getPopularMovies();
          items = res.results.slice(0, 10);
          mediaType = "movie";
        } else if (activeTab === "streaming") {
          const res = await tmdbAPI.getPopularTVShows();
          items = res.results.slice(0, 10);
          mediaType = "tv";
        } else if (activeTab === "tv") {
          const res = await tmdbAPI.getTrendingTV("week");
          items = res.results.slice(0, 10);
          mediaType = "tv";
        } else if (activeTab === "rent") {
          const res = await tmdbAPI.getTopRatedMovies();
          items = res.results.slice(0, 10);
          mediaType = "movie";
        } else if (activeTab === "cinemas") {
          const res = await tmdbAPI.getNowPlayingMovies();
          items = res.results.slice(0, 10);
          mediaType = "movie";
        }

        // Fetch videos in parallel (limit to first 8 to avoid rate limiting)
        const videoResults = await Promise.allSettled(
          items.slice(0, 8).map((item) =>
            mediaType === "movie"
              ? tmdbAPI.getMovieVideos(item.id)
              : tmdbAPI.getTVShowVideos(item.id)
          )
        );

        const collected: TrailerItem[] = [];
        videoResults.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            const videos: Video[] = result.value.results;
            const trailer =
              videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
              videos.find((v) => v.site === "YouTube");
            if (trailer) {
              const item = items[idx];
              const title = "title" in item ? item.title : item.name;
              collected.push({
                id: item.id,
                title,
                backdropPath: item.backdrop_path,
                videoKey: trailer.key,
                videoName: trailer.name,
                mediaType,
              });
            }
          }
        });

        setTrailers(collected);
      } catch (err) {
        console.error("Error fetching trailers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrailers();
  }, [activeTab]);

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Últimos Trailers</h2>
        <div className="flex flex-wrap gap-1 bg-black/30 rounded-full p-1 border border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : trailers.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum trailer encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {trailers.map((trailer) => (
            <div
              key={`${trailer.mediaType}-${trailer.id}`}
              className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              onClick={() => setSelectedTrailer(trailer)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-black/50 relative overflow-hidden">
                {trailer.backdropPath ? (
                  <img
                    src={getImageUrl(trailer.backdropPath, BACKDROP_SIZES.SMALL)}
                    alt={trailer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                )}

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Play size={18} className="text-white fill-white ml-0.5" />
                  </div>
                </div>

                {/* Three dots menu (decorative, like TMDB) */}
                <button
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Opções"
                >
                  <span className="text-xs leading-none">•••</span>
                </button>
              </div>

              {/* Info */}
              <div className="p-3 bg-gradient-to-b from-black/60 to-black/90">
                <p className="text-sm font-semibold text-white truncate">{trailer.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{trailer.videoName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trailer Modal */}
      {selectedTrailer && (
        <TrailerModal
          videoKey={selectedTrailer.videoKey}
          title={`${selectedTrailer.title} — ${selectedTrailer.videoName}`}
          onClose={() => setSelectedTrailer(null)}
        />
      )}
    </section>
  );
};

export default LatestTrailers;
