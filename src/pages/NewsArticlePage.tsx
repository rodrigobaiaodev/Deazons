import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, ChevronLeft, CalendarDays, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NewsArticlePage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const navigate = useNavigate();
   
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      let query = supabase.from("articles").select("*").eq("slug", id);
      
      if (!isPreview) {
        query = query.eq("status", "published");
      }
      
      const { data, error } = await query.single();
      
      if (data && !error) {
        setArticle(data);
        
        // --- SEO & META TAGS ---
        const pageUrl = `https://deazons.com/noticias/${data.slug}`;
        document.title = `${data.title} | Deazons`;
        
        // Update Meta Description
        updateMetaTag('description', data.meta_description);
        updateMetaTag('og:title', data.title);
        updateMetaTag('og:description', data.meta_description);
        updateMetaTag('og:image', data.image_url);
        updateMetaTag('og:url', pageUrl);
        updateMetaTag('og:type', 'article');
        updateMetaTag('twitter:title', data.title);
        updateMetaTag('twitter:description', data.meta_description);
        updateMetaTag('twitter:image', data.image_url);

        // Canonical Link
        updateCanonicalTag(pageUrl);

        // JSON-LD NewsArticle
        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": data.title,
          "description": data.meta_description,
          "image": [data.image_url],
          "datePublished": data.published_at || data.created_at,
          "dateModified": data.updated_at || data.created_at,
          "author": [{
            "@type": "Organization",
            "name": "Equipe Deazons",
            "url": "https://deazons.com"
          }],
          "publisher": {
            "@type": "Organization",
            "name": "Deazons",
            "logo": {
              "@type": "ImageObject",
              "url": "https://deazons.com/deazons-logo.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": pageUrl
          }
        };
        
        let script = document.getElementById('json-ld-article');
        if (!script) {
          script = document.createElement('script');
          script.id = 'json-ld-article';
          script.setAttribute('type', 'application/ld+json');
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(jsonLd);

        // --- RELACIONADOS ---
        const { data: related } = await supabase
          .from("articles")
          .select("id, title, slug, image_url, category, created_at")
          .eq("status", "published")
          .neq("id", data.id)
          .limit(3);
        
        setRelatedArticles(related || []);
      }
      setLoading(false);
    };

    const updateMetaTag = (name: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          const attr = name.startsWith('og:') ? 'property' : 'name';
          tag.setAttribute(attr, name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    }

    const updateCanonicalTag = (url: string) => {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    if (id) {
      fetchArticle();
    }
    
    return () => {
      // Cleanup
      const script = document.getElementById('json-ld-article');
      if (script) script.remove();
      // Reset title to default if needed or handled by other pages
    };
  }, [id, isPreview]);

  // Helper to generate Table of Contents from content
  const generateTOC = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headers = doc.querySelectorAll('h2');
    return Array.from(headers).map((h, index) => ({
      text: h.textContent,
      id: `section-${index}`
    }));
  };

  const toc = article ? generateTOC(article.content) : [];

  // Inject IDs to H2s in content
  const contentWithIds = article?.content.replace(/<h2>/g, (match, offset, string) => {
    const index = string.slice(0, offset).split('<h2>').length - 1;
    return `<h2 id="section-${index}">`;
  });

  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const text = article?.title;
    let shareUrl = '';
    
    switch(platform) {
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
    }
    window.open(shareUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center -mt-20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center -mt-20">
        <h2 className="text-2xl font-bold mb-4">Artigo não encontrado</h2>
        <Button onClick={() => navigate("/noticias")} variant="default">
          Voltar para Notícias
        </Button>
      </div>
    );
  }

  // Find content split point for middle ad
  const contentParts = article.content.split('<h2>');
  const hasMultipleH2 = contentParts.length > 2;
  const middleIndex = Math.floor(contentParts.length / 2);

  return (
    <article className="min-h-screen pt-24 pb-20 bg-background text-foreground">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6">
        {/* Navegação */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 pl-0 hover:bg-transparent hover:text-primary transition-colors gap-2 text-muted-foreground"
          onClick={() => navigate("/noticias")}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Noticias
        </Button>        {/* Cabeçalho do Artigo (Metadados) */}
        <header className="mb-6">
          <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-full text-sm font-semibold border-none">
            {article.category}
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border/50 pb-6 mb-8">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <time>
                {new Date(article.published_at || article.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{Math.max(5, Math.ceil(article.content?.split(' ').length / 200))} min de leitura</span>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <Button onClick={() => shareOnSocial('twitter')} variant="outline" size="icon" className="w-8 h-8 rounded-full"><Share2 className="w-3 h-3" /></Button>
              <Button onClick={() => shareOnSocial('whatsapp')} variant="outline" size="icon" className="w-8 h-8 rounded-full"><Share2 className="w-3 h-3 text-green-500" /></Button>
              <Button onClick={() => shareOnSocial('facebook')} variant="outline" size="icon" className="w-8 h-8 rounded-full"><Share2 className="w-3 h-3 text-blue-500" /></Button>
            </div>
          </div>
        </header>

        {/* Table of Contents - SEO Booster & UX */}
        {toc.length > 0 && (
          <div className="mb-10 p-6 rounded-2xl bg-secondary/10 border border-border/50">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Neste artigo:
            </h4>
            <nav className="flex flex-col gap-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm py-1 border-l-2 border-transparent hover:border-primary/30 pl-3"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Conteúdo Renderizado a partir do Gemini com Estilização Premium */}
        <div 
          className="prose prose-invert prose-lg max-w-none 
            prose-h1:hidden
            prose-h2:text-2xl prose-h2:font-bold prose-h2:text-primary prose-h2:mt-12 prose-h2:mb-4 prose-h2:scroll-mt-24
            prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:mb-6
            prose-img:rounded-2xl prose-img:border prose-img:border-border/30 prose-img:shadow-lg prose-img:w-full
            prose-a:text-primary hover:prose-a:text-primary/80"
          dangerouslySetInnerHTML={{ __html: contentWithIds || '' }}
        />

        <style dangerouslySetInnerHTML={{ __html: `
          .prose h2 { color: hsl(var(--primary)) !important; }
        `}} />

        {/* Author Card exclusivo */}
        <div className="mt-16 p-8 rounded-3xl bg-secondary/10 border border-border/50 flex flex-col md:flex-row items-center gap-8 group">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h4 className="text-xl font-bold">Equipe Deazons</h4>
              <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] uppercase tracking-widest px-2 py-0.5 border-none">Verificado</Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Especialistas apaixonados por cinema, séries e toda a vasta tapeçaria da cultura pop. Com um olhar crítico apurado e um entusiasmo contagiante, buscamos trazer as melhores análises, notícias exclusivas e insights aprofundados para nossos leitores. Nosso compromisso é desvendar os universos que amamos, oferecendo conteúdo que informa, diverte e provoca reflexão, sempre com a paixão nerd que nos move.
            </p>
          </div>
        </div>

        {/* Artigos Relacionados */}
        {relatedArticles.length > 0 && (
          <div className="mt-20 pt-10 border-t border-border/50">
            <h3 className="text-2xl font-bold mb-8">Artigos Relacionados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <div 
                  key={rel.id} 
                  className="group cursor-pointer"
                  onClick={() => navigate(`/noticias/${rel.slug}`)}
                >
                  <div className="aspect-video rounded-xl overflow-hidden mb-3 border border-border/30">
                    <img 
                      src={rel.image_url} 
                      alt={rel.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase mb-2 h-5 border-primary/30 text-primary">{rel.category}</Badge>
                  <h4 className="font-bold line-clamp-2 group-hover:text-primary transition-colors text-sm">{rel.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default NewsArticlePage;
