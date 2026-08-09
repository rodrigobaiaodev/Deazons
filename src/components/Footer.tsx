import { Link } from "react-router-dom";
import Logo from "./Logo";

const CONTACT_EMAIL = "contato@deazons.com";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 mt-auto bg-[#050505]">
      <div className="container py-12 px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-1">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Portal de filmes, séries, notícias e artigos sobre entretenimento — com fichas técnicas, elenco e onde assistir.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block text-sm text-primary hover:underline break-all"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Navegação</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/filmes" className="hover:text-primary transition-colors">Filmes</Link></li>
              <li><Link to="/series" className="hover:text-primary transition-colors">Séries</Link></li>
              <li><Link to="/noticias" className="hover:text-primary transition-colors">Notícias</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/pessoas" className="hover:text-primary transition-colors">Pessoas</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Explorar</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/filmes?genre=28" className="hover:text-primary transition-colors">Ação</Link></li>
              <li><Link to="/filmes?genre=35" className="hover:text-primary transition-colors">Comédia</Link></li>
              <li><Link to="/filmes?genre=18" className="hover:text-primary transition-colors">Drama</Link></li>
              <li><Link to="/filmes?genre=27" className="hover:text-primary transition-colors">Terror</Link></li>
              <li><Link to="/series" className="hover:text-primary transition-colors">Séries populares</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Institucional</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/sobre" className="hover:text-primary transition-colors">Sobre nós</Link></li>
              <li><Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/contato" className="hover:text-primary transition-colors">Contato</Link></li>
              <li>
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Dados: TMDB
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            &copy; {currentYear} Deazons. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground text-center sm:text-right max-w-md">
            Informações de filmes/séries via API do TMDB. O Deazons não é endossado nem certificado pelo TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
