
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Home, Film, Tv, Users, Info, Newspaper } from "lucide-react";
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
  { path: "/sobre", label: "Sobre", icon: Info },
];

const MobileMenu = ({ open, onClose }: MobileMenuProps) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background/98 backdrop-blur-xl lg:hidden",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/40">
          <Logo />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 pb-20">
            <nav className="flex flex-col gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-accent text-foreground font-medium transition-colors"
                  onClick={onClose}
                >
                  <Icon size={18} className="text-primary" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MobileMenu;
