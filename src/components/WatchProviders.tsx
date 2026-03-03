
import { useState, useEffect } from "react";
import { tmdbAPI, WatchProvider, WatchProviderResult } from "@/services/tmdb";
import { getImageUrl } from "@/services/tmdb";
import { Tv2 } from "lucide-react";

interface WatchProvidersProps {
  mediaId: number;
  mediaType: "movie" | "tv";
}

interface ProviderGroup {
  label: string;
  items: WatchProvider[];
}

const WatchProviders = ({ mediaId, mediaType }: WatchProvidersProps) => {
  const [providers, setProviders] = useState<WatchProviderResult | null>(null);
  const [tmdbLink, setTmdbLink] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [hasProviders, setHasProviders] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data =
          mediaType === "movie"
            ? await tmdbAPI.getMovieWatchProviders(mediaId)
            : await tmdbAPI.getTVWatchProviders(mediaId);

        const brData = data.results?.["BR"];
        if (brData && (brData.flatrate?.length || brData.rent?.length || brData.buy?.length)) {
          setProviders(brData);
          setTmdbLink(brData.link);
          setHasProviders(true);
        } else {
          setHasProviders(false);
        }
      } catch {
        setHasProviders(false);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [mediaId, mediaType]);

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-bold mb-3">Onde Assistir</h3>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasProviders) return null;

  const groups: ProviderGroup[] = [
    ...(providers?.flatrate?.length ? [{ label: "Streaming", items: providers.flatrate }] : []),
    ...(providers?.rent?.length ? [{ label: "Aluguel", items: providers.rent }] : []),
    ...(providers?.buy?.length ? [{ label: "Compra", items: providers.buy }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Tv2 size={18} className="text-primary" />
        <h3 className="text-lg font-bold">Onde Assistir</h3>
        {tmdbLink && (
          <a
            href={tmdbLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Ver mais →
          </a>
        )}
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((provider) => (
                <div
                  key={provider.provider_id}
                  title={provider.provider_name}
                  className="relative group/tip"
                >
                  <img
                    src={getImageUrl(provider.logo_path, "w92")}
                    alt={provider.provider_name}
                    className="w-11 h-11 rounded-xl object-cover border border-white/10 hover:border-primary/60 hover:scale-110 transition-all duration-200 shadow-md"
                    loading="lazy"
                  />
                  {/* Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                    {provider.provider_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-3">
        Dados fornecidos pela JustWatch
      </p>
    </div>
  );
};

export default WatchProviders;
