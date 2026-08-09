import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  X,
  Home,
  Film,
  Tv,
  Users,
  Info,
  Newspaper,
  BookOpen,
  Shield,
  FileText,
  Mail,
} from "lucide-react";
import Logo from "./Logo";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/filmes", label: "Filmes", icon: Film },
  { path: "/series", label: "Séries", icon: Tv },
  { path: "/pessoas", label: "Pessoas", icon: Users },
  { path: "/noticias", label: "Notícias", icon: Newspaper },
  { path: "/blog", label: "Blog", icon: BookOpen },
];

const legalItems = [
  { path: "/sobre", label: "Sobre", icon: Info },
  { path: "/privacidade", label: "Privacidade", icon: Shield },
  { path: "/termos", label: "Termos", icon: FileText },
  { path: "/contato", label: "Contato", icon: Mail },
];

const MobileMenu = ({ open, onClose }: MobileMenuProps) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/40 shrink-0">
        <Logo />
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <X size={24} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain p-4 pb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-3">
          Navegação
        </p>
        <ul className="flex flex-col gap-1 mb-8">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                className="flex items-center gap-3 min-h-[48px] px-3 py-3 rounded-xl hover:bg-accent text-foreground font-medium transition-colors"
                onClick={onClose}
              >
                <Icon size={20} className="text-primary shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-3">
          Institucional
        </p>
        <ul className="flex flex-col gap-1 mb-8">
          {legalItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                className="flex items-center gap-3 min-h-[48px] px-3 py-3 rounded-xl hover:bg-accent text-foreground font-medium transition-colors"
                onClick={onClose}
              >
                <Icon size={20} className="text-primary shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <a
          href="mailto:contato@deazons.com"
          className="mx-3 flex items-center justify-center min-h-[48px] rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          contato@deazons.com
        </a>
      </nav>
    </div>,
    document.body
  );
};

export default MobileMenu;
