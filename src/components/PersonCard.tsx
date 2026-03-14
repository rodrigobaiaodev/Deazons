
import { Link } from "react-router-dom";
import { getImageUrl, Person, PROFILE_SIZES } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  person: Person;
  className?: string;
}

const PersonCard = ({ person, className }: PersonCardProps) => {
  return (
    <Link 
      to={`/pessoas/${person.id}`} 
      className={cn("block transition-transform hover:scale-105", className)}
    >
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card">
        <img 
          src={getImageUrl(person.profile_path, PROFILE_SIZES.MEDIUM)} 
          alt={person.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-sm line-clamp-1">
          {person.name}
        </h3>
        {person.known_for_department && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {person.known_for_department}
          </p>
        )}
      </div>
    </Link>
  );
};

export default PersonCard;
