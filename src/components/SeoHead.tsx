import { Helmet } from "react-helmet-async";
import { useCanonicalUrl } from "@/hooks/useSeo";

const DEFAULT_IMAGE = "https://deazons.com/deazons-logo.png";

interface SeoHeadProps {
  title: string;
  description: string;
  /** Absolute URL to the OG image. Falls back to logo if omitted. */
  image?: string | null;
  /** og:type value – defaults to "website" */
  type?: string;
  /** Extra schema.org JSON-LD object (or array) to inject. Pass null to skip. */
  jsonLd?: object | object[] | null;
  /** Override the canonical URL (defaults to current path without query) */
  canonicalOverride?: string;
  /** If true, sets robots meta to noindex/nofollow */
  noIndex?: boolean;
}

/** Truncate at word boundary — never mid-word */
export function truncateAtWord(str: string, max = 160): string {
  if (!str) return "";
  const clean = String(str).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

/**
 * Drop-in SEO head: title, description, canonical, og:*, twitter:*.
 * Must be rendered inside <HelmetProvider> (set up in main.tsx).
 */
const SeoHead = ({
  title,
  description,
  image,
  type = "website",
  jsonLd,
  canonicalOverride,
  noIndex = false,
}: SeoHeadProps) => {
  const canonicalUrl = useCanonicalUrl();
  // Prefer override; always strip query/hash from pathname-based canonical
  const canonical = (canonicalOverride ?? canonicalUrl).split("?")[0].split("#")[0];
  const ogImage = image || DEFAULT_IMAGE;
  const safeTitle = truncateAtWord(title, 60);
  const safeDesc = truncateAtWord(description, 160);

  return (
    <Helmet>
      {/* ── Core ── */}
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={canonical} />

      {/* Robots — override the baseline index,follow from index.html when needed */}
      <meta
        name="robots"
        content={
          noIndex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />

      {/* ── Open Graph ── */}
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Deazons" />
      <meta property="og:locale" content="pt_BR" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@deazons" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      <meta name="twitter:image" content={ogImage} />

      {/* ── Optional JSON-LD ── */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SeoHead;
