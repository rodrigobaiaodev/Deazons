import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  imageUrl: string;
  content?: string;
}

interface NewsCardProps {
  article: NewsArticle;
  className?: string;
}

const NewsCard = ({ article, className }: NewsCardProps) => {
  return (
    <Link 
      to={`/noticias/${article.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card text-card-foreground shadow transition-all hover:shadow-lg hover:border-border/80",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary/90 hover:bg-primary backdrop-blur-sm border-none shadow-sm font-medium">
            {article.category}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <time dateTime={article.date}>{article.date}</time>
        </div>
        <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mt-auto">
          {article.summary}
        </p>
      </div>
    </Link>
  );
};

export default NewsCard;
