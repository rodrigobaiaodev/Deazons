
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
            <Route path="/filmes" element={<Movies />} />
            <Route path="/filmes/:slug" element={<MovieDetails />} />
            <Route path="/filmes/:slug/cast" element={<MovieCast />} />
            <Route path="/series" element={<TVShows />} />
            <Route path="/series/:slug" element={<TVShowDetails />} />
            <Route path="/series/:slug/cast" element={<TVShowCast />} />
            <Route path="/pessoas" element={<People />} />
            <Route path="/pessoas/:id" element={<PersonDetails />} />
            <Route path="/pessoas/:id/:mediaType" element={<PersonFilmography />} />
            <Route path="/pesquisa" element={<Search />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos" element={<TermsOfService />} />
            <Route path="/contato" element={<Contact />} />
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
