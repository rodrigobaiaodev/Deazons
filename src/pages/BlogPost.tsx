import { useEffect, useState, Suspense, lazy } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogPosts } from "@/blog/data/posts";
import { BlogPostMeta } from "@/blog/data/types";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CalendarDays, Share2 } from "lucide-react";
import imagesDataRaw from "@/blog/data/images.json";

const imagesData = imagesDataRaw as Record<string, { url: string; alt: string; photographer: string; photographer_url: string }[]>;

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostMeta | null>(null);

  useEffect(() => {
    const foundPost = blogPosts.find(p => p.slug === slug);
    if (foundPost) {
      setPost(foundPost);
    } else {
      navigate("/404", { replace: true });
    }
  }, [slug, navigate]);

  if (!post) return null;

  const images = imagesData[post.slug] || [];
  const coverImage = images.length > 0 ? images[0] : null;

  // We lazily load the specific markdown/JSX component based on post.componentName
  // Assuming they are stored in src/blog/posts/
  const PostContent = lazy(() => import(`@/blog/posts/${post.componentName}.tsx`).catch(() => {
    return { default: () => <div className="p-8 text-center text-red-400 border border-red-500/20 rounded-xl bg-red-500/10">Este artigo ainda não foi escrito ou ocorreu um erro ao carregá-lo. (Component: {post.componentName})</div> };
  }));

  const shareOnSocial = (platform: string) => {
    const url = encodeURIComponent(`https://deazons.com/blog/${post.slug}`);
    const title = encodeURIComponent(post.title);
    
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
    if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${title} ${url}`, '_blank');
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const pageUrl = `https://deazons.com/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": coverImage ? [coverImage.url] : ["https://deazons.com/deazons-logo.png"],
    "datePublished": post.publishedAt,
    "author": [{ "@type": "Organization", "name": "Equipe Deazons", "url": "https://deazons.com" }],
    "publisher": {
      "@type": "Organization",
      "name": "Deazons",
      "logo": { "@type": "ImageObject", "url": "https://deazons.com/deazons-logo.png" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl }
  };

  return (
    <article className="min-h-screen pt-24 pb-20 bg-background text-foreground">
      <SeoHead
        title={`${post.title} | Deazons`}
        description={post.description}
        image={coverImage?.url}
        type="article"
        canonicalOverride={pageUrl}
        jsonLd={jsonLd}
      />
      
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 pl-0 hover:bg-transparent hover:text-primary transition-colors gap-2 text-muted-foreground"
          onClick={() => navigate("/blog")}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Blog
        </Button>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border/50 pb-6 mb-8">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <time>
                {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
              </time>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <Button onClick={() => shareOnSocial('twitter')} variant="outline" size="icon" className="w-8 h-8 rounded-full"><Share2 className="w-3 h-3" /></Button>
              <Button onClick={() => shareOnSocial('whatsapp')} variant="outline" size="icon" className="w-8 h-8 rounded-full"><Share2 className="w-3 h-3 text-green-500" /></Button>
              <Button onClick={() => shareOnSocial('facebook')} variant="outline" size="icon" className="w-8 h-8 rounded-full"><Share2 className="w-3 h-3 text-blue-500" /></Button>
            </div>
          </div>

          {coverImage && (
            <div className="mb-10">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl bg-muted relative">
                <img 
                  src={coverImage.url} 
                  alt={coverImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Foto de <a href={coverImage.photographer_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{coverImage.photographer}</a> no Pexels
              </p>
            </div>
          )}
        </header>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl">
          <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-4 bg-muted rounded w-3/4"></div><div className="h-4 bg-muted rounded w-full"></div><div className="h-4 bg-muted rounded w-5/6"></div></div>}>
            <PostContent images={images} />
          </Suspense>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;
