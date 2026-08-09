import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import SeoHead from "@/components/SeoHead";

const About = () => {
  return (
    <div className="min-h-screen pb-16 pt-24">
      <SeoHead
        title="Sobre o Deazons | Filmes, Séries e Entretenimento"
        description="Conheça o Deazons, seu portal completo sobre filmes, séries e personalidades do cinema. Saiba como usamos o TMDB para trazer informações precisas."
        canonicalOverride="https://deazons.com/sobre"
      />
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Sobre o Deazons</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            O Deazons é uma plataforma para entusiastas de filmes e séries de TV que fornece acesso a uma vasta 
            coleção de informações sobre produções, seriados e personalidades da indústria do entretenimento.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Nossa Missão</h2>
          <p>
            Nosso objetivo é ajudar o público brasileiro a descobrir filmes e séries com fichas claras,
            elenco, trailers, onde assistir e artigos editoriais sobre cultura pop — em uma experiência
            rápida no celular e no computador.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Conteúdo do site</h2>
          <p>
            O Deazons combina:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Páginas de filmes, séries e pessoas com dados da API do The Movie Database (TMDB);</li>
            <li>Notícias de entretenimento reescritas pela nossa equipe editorial;</li>
            <li>Artigos do blog com guias, listas e análises próprias.</li>
          </ul>
          <p>
            Créditos de metadados e imagens promocionais de catálogo: TMDB. Textos editoriais de notícias
            e blog são produzidos/reescritos pelo Deazons.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Tecnologias Utilizadas</h2>
          <p>
            O site é construído com React, TypeScript e Tailwind CSS, hospedado com HTTPS, e otimizado
            para leitura em dispositivos móveis e desktop.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contato</h2>
          <p>
            Dúvidas ou solicitações:{" "}
            <a href="mailto:contato@deazons.com" className="text-primary hover:underline">
              contato@deazons.com
            </a>{" "}
            ou a{" "}
            <Link to="/contato" className="text-primary hover:underline">
              página de contato
            </Link>
            .
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Créditos e Agradecimentos</h2>
          <p>
            Este projeto utiliza a API do The Movie Database (TMDB). O Deazons não é afiliado nem
            endossado pelo TMDB.
          </p>
          
          <div className="my-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button asChild className="min-h-[44px]">
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Visite o TMDB
                <ExternalLink size={16} />
              </a>
            </Button>
            
            <Button variant="outline" asChild className="min-h-[44px]">
              <Link to="/contato">Fale conosco</Link>
            </Button>
          </div>
          
          <div className="mt-8">
            <Button asChild variant="secondary" className="min-h-[44px]">
              <Link to="/">Voltar para a Página Inicial</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
