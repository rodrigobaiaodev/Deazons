
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">About Deazons</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            Deazons is a platform for movie and TV show enthusiasts that provides access to a vast 
            collection of information about films, TV series, and entertainment industry personalities.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p>
            Our goal is to create an enjoyable experience for cinema and television enthusiasts, 
            offering an extensive database with detailed information about audiovisual productions 
            from around the world.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Database</h2>
          <p>
            Deazons uses The Movie Database (TMDB) API to provide accurate and up-to-date 
            information about movies, TV shows, and personalities. This allows us to offer:
          </p>
          
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Over 500,000 cataloged movies</li>
            <li>Information about more than 100,000 TV series</li>
            <li>Detailed profiles of actors, directors, and other professionals</li>
            <li>Data about releases, ratings, and much more</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Technologies Used</h2>
          <p>
            Deazons is developed using modern technologies to ensure 
            the best user experience:
          </p>
          
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>React.js for a responsive and dynamic interface</li>
            <li>Tailwind CSS for efficient styling</li>
            <li>TypeScript for more robust and maintainable code</li>
            <li>TMDB API for movie and TV show data</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Credits and Acknowledgments</h2>
          <p>
            This project would not be possible without The Movie Database (TMDB), which provides 
            access to its extensive API. Deazons is not officially affiliated with TMDB.
          </p>
          
          <div className="my-8 flex items-center gap-4">
            <Button asChild>
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Visit TMDB
                <ExternalLink size={16} />
              </a>
            </Button>
            
            <Button variant="outline" asChild>
              <a 
                href="https://developer.themoviedb.org/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                API Documentation
                <ExternalLink size={16} />
              </a>
            </Button>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact and Support</h2>
          <p>
            For more information about the project or to report issues, 
            please contact us or visit our GitHub repository.
          </p>
          
          <div className="mt-8">
            <Button asChild>
              <Link to="/">Back to home page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
