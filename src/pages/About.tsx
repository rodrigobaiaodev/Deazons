import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Sobre o Deazons</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            O Deazons é uma plataforma para entusiastas de filmes e séries de TV que fornece acesso a uma vasta 
            coleção de informações sobre produções, seriados e personalidades da indústria do entretenimento.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Nossa Missão</h2>
          <p>
            Nosso objetivo é criar uma experiência agradável para os apaixonados por cinema e televisão, 
            oferecendo um banco de dados extenso com informações detalhadas sobre produções audiovisuais 
            de todo o mundo.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Nosso Banco de Dados</h2>
          <p>
            O Deazons utiliza a API do The Movie Database (TMDB) para fornecer informações 
            precisas e atualizadas sobre produções, séries de TV e personalidades. Isso nos permite oferecer:
          </p>
          
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Mais de 500.000 filmes catalogados</li>
            <li>Informações sobre mais de 100.000 séries de TV</li>
            <li>Perfis detalhados de atores, diretores e outros profissionais</li>
            <li>Dados sobre lançamentos, avaliações e muito mais</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Tecnologias Utilizadas</h2>
          <p>
            O Deazons é desenvolvido utilizando as melhores tecnologias modernas para garantir 
            a melhor experiência do usuário:
          </p>
          
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>React.js para uma interface dinâmica e responsiva</li>
            <li>Tailwind CSS para estilos eficientes</li>
            <li>TypeScript para um código mais robusto e manutenível</li>
            <li>API TMDB para os dados de filmes e séries</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Créditos e Agradecimentos</h2>
          <p>
            Este projeto não seria possível sem O The Movie Database (TMDB), que disponibiliza 
            acesso à sua rica API. O Deazons não é oficialmente afiliado ao TMDB.
          </p>
          
          <div className="my-8 flex items-center gap-4">
            <Button asChild>
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
            
            <Button variant="outline" asChild>
              <a 
                href="https://developer.themoviedb.org/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Documentação da API
                <ExternalLink size={16} />
              </a>
            </Button>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contato e Suporte</h2>
          <p>
            Para maiores informações sobre o projeto ou reportar problemas, 
            por favor entre em contato conosco pelos canais oficiais ou pelo formulário do site.
          </p>
          
          <div className="mt-8">
            <Button asChild>
              <Link to="/">Voltar para a Página Inicial</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
