
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import People from "./pages/People";
import Search from "./pages/Search";
import MovieDetails from "./pages/MovieDetails";
import MovieCast from "./pages/MovieCast";
import TVShowDetails from "./pages/TVShowDetails";
import TVShowCast from "./pages/TVShowCast";
import PersonDetails from "./pages/PersonDetails";
import PersonFilmography from "./pages/PersonFilmography";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import SitemapGenerator from "./components/SitemapGenerator";
import NewsList from "./pages/NewsList";
import NewsArticlePage from "./pages/NewsArticlePage";
import AdminRSS from "./pages/AdminRSS";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <SitemapGenerator />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:slug" element={<MovieDetails />} />
            <Route path="/movies/:slug/cast" element={<MovieCast />} />
            <Route path="/tv" element={<TVShows />} />
            <Route path="/tvs/:slug" element={<TVShowDetails />} />
            <Route path="/tvs/:slug/cast" element={<TVShowCast />} />
            <Route path="/people" element={<People />} />
            <Route path="/people/:id" element={<PersonDetails />} />
            <Route path="/people/:id/:mediaType" element={<PersonFilmography />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/noticias" element={<NewsList />} />
            <Route path="/noticias/:id" element={<NewsArticlePage />} />
            <Route path="/admin/rss" element={<AdminRSS />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
