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
  /** Extra schema.org JSON-LD object to inject. Pass null to skip. */
  jsonLd?: object | null;
  /** Override the canonical URL (defaults to current path) */
  canonicalOverride?: string;
  /** If true, sets robots meta to noindex/nofollow */
  noIndex?: boolean;
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
  const canonical = canonicalOverride ?? canonicalUrl;
  const ogImage = image || DEFAULT_IMAGE;

  // Trim description to ≤160 chars for best snippet display
  const safeDesc = description?.length > 160
    ? description.substring(0, 157) + "..."
    : description;

  return (
    <Helmet>
      {/* ── Core ── */}
      <title>{title}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={canonical} />

      {/* Robots Conditional NoIndex */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── Open Graph ── */}
      <meta property="og:title" content={title} />
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
      <meta name="twitter:title" content={title} />
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
