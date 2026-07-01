import { useState } from "react";
import { Link } from "react-router-dom";
import { blogPosts } from "@/blog/data/posts";
import { BlogPostMeta } from "@/blog/data/types";
import SeoHead from "@/components/SeoHead";
import { Input } from "@/components/ui/input";
import { CalendarDays, Search as SearchIcon } from "lucide-react";
import imagesDataRaw from "@/blog/data/images.json";

// Type casting the imported JSON
const imagesData = imagesDataRaw as Record<string, { url: string; alt: string; photographer: string }[]>;

const BlogCard = ({ post }: { post: BlogPostMeta }) => {
  const images = imagesData[post.slug] || [];
  const coverImage = images.length > 0 ? images[0].url : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2670&auto=format&fit=crop";

  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 transition-colors">
      <div className="aspect-video overflow-hidden relative">
        <img 
          src={coverImage} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <CalendarDays className="w-3.5 h-3.5" />
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric"
            })}
          </time>
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
          {post.description}
        </p>
        <span className="text-sm font-medium text-primary mt-auto">Ler artigo completo →</span>
      </div>
    </Link>
  );
};

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 pt-24 bg-background">
      <SeoHead
        title="Blog Deazons | Artigos e Guias sobre Filmes e Streaming"
        description="Confira nossos artigos completos, guias definitivos e curiosidades sobre o mundo do cinema, séries e serviços de streaming."
        canonicalOverride="https://deazons.com/blog"
      />
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Artigos & Guias
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Descubra curiosidades, guias de assinatura, comparações e dicas sobre o universo do streaming e cinema.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              placeholder="Buscar artigos..."
            />
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed rounded-xl border-border/50">
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">Nenhum artigo encontrado.</h2>
            <p className="text-sm text-muted-foreground">Tente usar outros termos na sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
