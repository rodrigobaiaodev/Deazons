import { useState, useEffect } from "react";
import { tmdbAPI, WatchProvider, WatchProviderResult } from "@/services/tmdb";
import { getImageUrl } from "@/services/tmdb";
import { Tv2, ExternalLink } from "lucide-react";

interface WatchProvidersProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  /** Título do filme/série — usado para montar o link no streaming */
  title: string;
}

interface ProviderGroup {
  label: string;
  items: WatchProvider[];
}

/**
 * Monta URL da página/busca do título no serviço correspondente.
 * TMDB não envia deep-link por provedor; usamos busca nativa + fallback JustWatch.
 */
function getProviderWatchUrl(
  provider: WatchProvider,
  title: string,
  fallbackLink?: string
): string {
  const q = encodeURIComponent(title.trim());
  const name = provider.provider_name.toLowerCase();

  // IDs comuns TMDB (BR / global)
  const byId: Record<number, string> = {
    8: `https://www.netflix.com/search?q=${q}`,
    9: `https://www.primevideo.com/search?phrase=${q}`,
    10: `https://www.amazon.com.br/s?k=${q}&i=instant-video`,
    119: `https://www.primevideo.com/search?phrase=${q}`,
    2100: `https://www.primevideo.com/search?phrase=${q}`, // Prime with ads
    337: `https://www.disneyplus.com/pt-br/search/${q}`,
    350: `https://tv.apple.com/br/search?term=${q}`,
    2: `https://tv.apple.com/br/search?term=${q}`,
    3: `https://play.google.com/store/search?q=${q}&c=movies`,
    384: `https://www.max.com/search?q=${q}`,
    1899: `https://www.max.com/search?q=${q}`,
    531: `https://www.paramountplus.com/br/search/?q=${q}`,
    307: `https://globoplay.globo.com/busca/?q=${q}`,
    283: `https://www.crunchyroll.com/pt-br/search?q=${q}`,
    11: `https://www.mubi.com/pt_BR/search/films?q=${q}`,
    15: `https://www.hulu.com/search?q=${q}`,
    386: `https://www.peacocktv.com/search?q=${q}`,
    257: `https://www.fubo.tv/welcome/search?q=${q}`,
    73: `https://tubitv.com/search/${q}`,
    192: `https://www.youtube.com/results?search_query=${q}`,
    68: `https://www.microsoft.com/store/search?q=${q}`,
    35: `https://www.rakuten.tv/br/search?q=${q}`,
    167: `https://www.claro.com.br/claro-tv-mais/busca?q=${q}`,
    2273: `https://www.skyshowtime.com/search?q=${q}`,
  };

  if (byId[provider.provider_id]) {
    return byId[provider.provider_id];
  }

  if (name.includes("netflix")) return byId[8];
  if (name.includes("prime") || name.includes("amazon")) return byId[119];
  if (name.includes("disney")) return byId[337];
  if (name.includes("apple")) return byId[350];
  if (name.includes("max") || name.includes("hbo")) return byId[1899];
  if (name.includes("paramount")) return byId[531];
  if (name.includes("globo")) return byId[307];
  if (name.includes("crunchyroll")) return byId[283];
  if (name.includes("mubi")) return byId[11];
  if (name.includes("youtube")) return byId[192];
  if (name.includes("google") || name.includes("play")) return byId[3];

  // Página JustWatch/TMDB deste título (melhor que link genérico)
  if (fallbackLink) return fallbackLink;

  return `https://www.justwatch.com/br/busca?q=${q}`;
}

const WatchProviders = ({ mediaId, mediaType, title }: WatchProvidersProps) => {
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
            className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            Ver mais
            <ExternalLink size={12} />
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
              {group.items.map((provider) => {
                const href = getProviderWatchUrl(provider, title, tmdbLink);
                return (
                  <a
                    key={provider.provider_id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Assistir em ${provider.provider_name}`}
                    aria-label={`Abrir ${title} no ${provider.provider_name}`}
                    className="relative group/tip block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  >
                    <img
                      src={getImageUrl(provider.logo_path, "w92")}
                      alt={provider.provider_name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10 group-hover/tip:border-primary/60 group-hover/tip:scale-110 transition-all duration-200 shadow-md"
                      loading="lazy"
                    />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                      {provider.provider_name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-3">
        Dados fornecidos pela JustWatch · clique no ícone para abrir no streaming
      </p>
    </div>
  );
};

export default WatchProviders;
