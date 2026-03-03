
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { tmdbAPI } from '@/services/tmdb';

// This is a component that doesn't render anything but helps generate data for a sitemap
const SitemapGenerator = () => {
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);
  
  // Function to log visited pages for analytics and potential sitemap updates
  useEffect(() => {
    console.info(`Page visited: ${location.pathname}`);
    
    // In a real implementation, you would send this data to your backend
    // which would then update the sitemap.xml file
    
    const pageData = {
      url: `https://deazons.com${location.pathname}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: location.pathname === '/' ? 'daily' : 'weekly',
      priority: location.pathname === '/' ? '1.0' : '0.8'
    };
    
    // This would typically be a server-side function:
    // submitToSitemapGenerator(pageData);
  }, [location.pathname]);
  
  // Fetch popular items once to include them in the sitemap
  useEffect(() => {
    // Only run this once to avoid repeated API calls
    if (initialized) return;
    
    const fetchPopularItems = async () => {
      try {
        // This would be a server-side function in production
        // Here we're just demonstrating what would be fetched

        // For development purposes, we're logging what would be added to the sitemap
        const [movies, shows, people] = await Promise.all([
          tmdbAPI.getPopularMovies(1),
          tmdbAPI.getPopularTVShows(1),
          tmdbAPI.getPopularPeople(1)
        ]);
        
        // In a full implementation, these would be written to the sitemap.xml file
        // on the server-side, not in the client-side component
        
        // Log sample of what would be added to sitemap
        console.info('Sample sitemap entries that would be generated on server:');
        
        // Sample movie entries
        movies.results.slice(0, 3).forEach(movie => {
          console.info({
            url: `https://deazons.com/movies/${movie.id}`,
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8'
          });
        });
        
        // Sample show entries
        shows.results.slice(0, 3).forEach(show => {
          console.info({
            url: `https://deazons.com/tvs/${show.id}`,
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8'
          });
        });
        
        // Sample people entries
        people.results.slice(0, 3).forEach(person => {
          console.info({
            url: `https://deazons.com/people/${person.id}`,
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'monthly',
            priority: '0.7'
          });
        });
        
      } catch (error) {
        console.error('Error fetching data for sitemap:', error);
      }
      
      setInitialized(true);
    };

    fetchPopularItems();
  }, [initialized]);

  return null; // This component doesn't render anything
};

export default SitemapGenerator;
