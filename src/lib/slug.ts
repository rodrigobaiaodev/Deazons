/**
 * Creates a URL-friendly slug from a title string.
 * Example: "The Bluff" → "the-bluff"
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-");            // collapse multiple hyphens
};

/**
 * Builds a slug URL for movies: /filmes/{id}-{slug}
 */
export const moviePath = (id: number, title: string): string =>
  `/filmes/${id}-${slugify(title)}`;

/**
 * Builds a slug URL for TV shows: /series/{id}-{slug}
 */
export const tvPath = (id: number, name: string): string =>
  `/series/${id}-${slugify(name)}`;

/**
 * Extracts the numeric ID from a slug param like "799882-the-bluff"
 */
export const extractId = (slugParam: string): number =>
  parseInt(slugParam.split("-")[0], 10);
