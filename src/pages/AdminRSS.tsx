import { useState, useEffect } from "react";
import { fetchAndProcessFeeds } from "@/services/rssSync";
import { supabaseAdmin, Article } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play, Check, Clock, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminRSS = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const { toast } = useToast();

  const fetchArticles = async () => {
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setArticles(data);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleImport = async () => {
    setLoading(true);
    setLogs(["Iniciando importação..."]);
    try {
      await fetchAndProcessFeeds(addLog);
      addLog("✅ Importação enviada com sucesso ao Gemini.");
      toast({
        title: "Sucesso",
        description: "Rotina de importação finalizada.",
      });
      await fetchArticles();
    } catch (err) {
      addLog("❌ Ocorreu um erro na importação global.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
    if (!error) {
       toast({ title: "Artigo deletado" });
       fetchArticles();
    }
  };

  const handlePublish = async (id: string) => {
    const { error } = await supabaseAdmin
      .from("articles")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
      
    if (!error) {
       toast({ title: "Artigo publicado!" });
       fetchArticles();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Painel de Redação Sênior</h1>
          <p className="text-muted-foreground">Gerencie artigos importados via RSS e reescritos por IA.</p>
        </div>
        
        <Button 
          onClick={handleImport} 
          disabled={loading}
          size="lg"
          className="gap-2"
        >
          <Play size={18} />
          {loading ? "Sincronizando..." : "Rodar Importação RSS Manual"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold">Artigos Repositório</h2>
          
          <div className="grid gap-4">
            {articles.map(article => (
              <div key={article.id} className="border border-border rounded-xl p-5 bg-card flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="w-full md:w-32 aspect-video bg-muted rounded-md overflow-hidden shrink-0 relative">
                  {article.image_url ? (
                    <img src={article.image_url} alt={article.image_alt || "Imagem de capa"} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem Capa</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg line-clamp-2 md:line-clamp-1">{article.title}</h3>
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="ml-2">
                        {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{article.category} • {article.meta_description}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botões de Ação */}
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/noticias/${article.slug}?preview=true`, '_blank')}>
                      <Eye size={14} /> Preview
                    </Button>
                    
                    {article.status === 'draft' && (
                      <Button variant="default" size="sm" className="gap-2" onClick={() => handlePublish(article.id)}>
                        <Check size={14} /> Publicar
                      </Button>
                    )}
                    
                    <Button variant="destructive" size="sm" className="gap-2" onClick={() => handleDelete(article.id)}>
                      <Trash2 size={14} /> Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="text-center py-10 border rounded-xl border-dashed">
                <p className="text-muted-foreground">Nenhum artigo importado ainda. Clique em "Rodar Importação".</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock size={18} /> Logs de Sincronização
            </h3>
            
            <div className="bg-background border border-border/50 rounded-lg p-3 h-[400px] overflow-y-auto text-sm font-mono space-y-2">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">Aguardando execução...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-muted-foreground break-words pb-1 border-b border-border/30 last:border-0">{`> ${log}`}</div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-primary">
              <Eye size={18} /> SEO & Sitemaps
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              O sitemap index foi atualizado com 400+ filmes, 400+ séries e todos os artigos publicados.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-background border border-border/50">
                <p className="text-xs font-bold uppercase mb-2">Google Indexing</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para indexação instantânea, certifique-se que o arquivo <code>service-account.json</code> está na raiz e rode o comando de notificação via terminal.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary/20 hover:bg-primary/10"
                onClick={() => {
                  toast({
                    title: "Comando Gerado",
                    description: "Execute 'node scripts/generate-sitemap.js' no terminal para atualizar o SEO.",
                  });
                }}
              >
                Gerar Sitemaps Agora
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                robots.txt → sitemap-index.xml
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRSS;
