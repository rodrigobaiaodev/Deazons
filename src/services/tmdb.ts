
const API_KEY = "6ea976a00b674fb5087f7e37ff72f45c";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const POSTER_SIZES = {
  SMALL: "w185",
  MEDIUM: "w342",
  LARGE: "w500",
  ORIGINAL: "original"
};

export const BACKDROP_SIZES = {
  SMALL: "w300",
  MEDIUM: "w780",
  LARGE: "w1280",
  ORIGINAL: "original"
};

export const PROFILE_SIZES = {
  SMALL: "w45",
  MEDIUM: "w185",
  LARGE: "h632",
  ORIGINAL: "original"
};

// Utility function to build image URLs
export const getImageUrl = (path: string | null, size: string): string => {
  if (!path) return "/placeholder.svg";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Create basic fetch function with error handling
const fetchFromTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const searchParams = new URLSearchParams({
    api_key: API_KEY,
    language: "pt-BR",
    ...params
  });
  
  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status}`);
  }
  
  return response.json();
};

// API Types
export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  popularity: number;
  original_title: string;
  original_language: string;
  adult: boolean;
  vote_count: number;
  video: boolean;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  popularity: number;
  original_name: string;
  original_language: string;
  vote_count: number;
  origin_country: string[];
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: (Movie | TVShow)[];
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number | null;
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
  homepage: string | null;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
}

export interface TVShowDetails extends TVShow {
  genres: Genre[];
  episode_run_time: number[];
  tagline: string | null;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  created_by: Person[];
  homepage: string | null;
  in_production: boolean;
  networks: Network[];
  seasons: Season[];
}

export interface PersonDetails extends Person {
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  biography: string;
  gender: number;
  also_known_as: string[];
  imdb_id: string | null;
  homepage: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Season {
  id: number;
  air_date: string | null;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  credit_id: string;
}

export interface Credits {
  id: number;
  cast: Cast[];
  crew: Crew[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface VideoResponse {
  id: number;
  results: Video[];
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderResult {
  flatrate?: WatchProvider[]; // streaming
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  link?: string;
}

export interface WatchProvidersResponse {
  id: number;
  results: Record<string, WatchProviderResult>;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// API Functions
export const tmdbAPI = {
  // Movies
  getTrending: (timeWindow: "day" | "week" = "day", page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>(`/trending/movie/${timeWindow}`, { page: page.toString() }),
    
  getPopularMovies: (page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>("/movie/popular", { page: page.toString() }),
    
  getTopRatedMovies: (page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>("/movie/top_rated", { page: page.toString() }),
    
  getUpcomingMovies: (page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>("/movie/upcoming", { page: page.toString() }),
    
  getMovieDetails: (id: number) => 
    fetchFromTMDB<MovieDetails>(`/movie/${id}`),
    
  getMovieCredits: (id: number) => 
    fetchFromTMDB<Credits>(`/movie/${id}/credits`),
    
  getMovieVideos: (id: number) => 
    fetchFromTMDB<VideoResponse>(`/movie/${id}/videos`),
    
  getSimilarMovies: (id: number, page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>(`/movie/${id}/similar`, { page: page.toString() }),

  getMovieWatchProviders: (id: number) =>
    fetchFromTMDB<WatchProvidersResponse>(`/movie/${id}/watch/providers`),

  // TV Shows
  getPopularTVShows: (page = 1) => 
    fetchFromTMDB<TMDBResponse<TVShow>>("/tv/popular", { page: page.toString() }),
    
  getTopRatedTVShows: (page = 1) => 
    fetchFromTMDB<TMDBResponse<TVShow>>("/tv/top_rated", { page: page.toString() }),
    
  getOnTheAirTVShows: (page = 1) => 
    fetchFromTMDB<TMDBResponse<TVShow>>("/tv/on_the_air", { page: page.toString() }),
    
  getTVShowDetails: (id: number) => 
    fetchFromTMDB<TVShowDetails>(`/tv/${id}`),
    
  getTVShowCredits: (id: number) => 
    fetchFromTMDB<Credits>(`/tv/${id}/credits`),
    
  getTVShowVideos: (id: number) => 
    fetchFromTMDB<VideoResponse>(`/tv/${id}/videos`),
    
  getSimilarTVShows: (id: number, page = 1) => 
    fetchFromTMDB<TMDBResponse<TVShow>>(`/tv/${id}/similar`, { page: page.toString() }),

  getTVWatchProviders: (id: number) =>
    fetchFromTMDB<WatchProvidersResponse>(`/tv/${id}/watch/providers`),

  // People
  getPopularPeople: (page = 1) => 
    fetchFromTMDB<TMDBResponse<Person>>("/person/popular", { page: page.toString() }),
    
  getPersonDetails: (id: number) => 
    fetchFromTMDB<PersonDetails>(`/person/${id}`),
    
  getPersonMovieCredits: (id: number) => 
    fetchFromTMDB<{ id: number; cast: Movie[]; crew: Movie[] }>(`/person/${id}/movie_credits`),
    
  getPersonTVCredits: (id: number) => 
    fetchFromTMDB<{ id: number; cast: TVShow[]; crew: TVShow[] }>(`/person/${id}/tv_credits`),
    
  // Search
  searchMulti: (query: string, page = 1) => 
    fetchFromTMDB<TMDBResponse<(Movie | TVShow | Person)>>("/search/multi", { query, page: page.toString() }),
    
  searchMovies: (query: string, page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>("/search/movie", { query, page: page.toString() }),
    
  searchTVShows: (query: string, page = 1) => 
    fetchFromTMDB<TMDBResponse<TVShow>>("/search/tv", { query, page: page.toString() }),
    
  searchPeople: (query: string, page = 1) => 
    fetchFromTMDB<TMDBResponse<Person>>("/search/person", { query, page: page.toString() }),

  // Genres
  getMovieGenres: () => 
    fetchFromTMDB<{ genres: Genre[] }>("/genre/movie/list"),
    
  getTVGenres: () => 
    fetchFromTMDB<{ genres: Genre[] }>("/genre/tv/list"),
    
  getMoviesByGenre: (genreId: number, page = 1) => 
    fetchFromTMDB<TMDBResponse<Movie>>("/discover/movie", { with_genres: genreId.toString(), page: page.toString() }),
    
  getTVShowsByGenre: (genreId: number, page = 1) => 
    fetchFromTMDB<TMDBResponse<TVShow>>("/discover/tv", { with_genres: genreId.toString(), page: page.toString() }),

  getNowPlayingMovies: (page = 1) =>
    fetchFromTMDB<TMDBResponse<Movie>>("/movie/now_playing", { page: page.toString() }),

  getTrendingTV: (timeWindow: "day" | "week" = "week") =>
    fetchFromTMDB<TMDBResponse<TVShow>>(`/trending/tv/${timeWindow}`),
};
