import { useLocation } from "react-router-dom";

const BASE_URL = "https://deazons.com";

export interface SeoProps {
  title: string;
  description: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
}

/**
 * Builds the canonical URL for the current page based on window.location.
 * Strips query-string and hash — canonical URLs should be clean.
 */
export function useCanonicalUrl(): string {
  const location = useLocation();
  return `${BASE_URL}${location.pathname}`;
}

export { BASE_URL };
