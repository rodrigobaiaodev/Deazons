import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import SearchButton from "./SearchButton";
import MobileMenu from "./MobileMenu";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { path: "/", label: "Início" },
  { path: "/filmes", label: "Filmes" },
  { path: "/series", label: "Séries" },
  { path: "/pessoas", label: "Pessoas" },
  { path: "/noticias", label: "Notícias" },
  { path: "/blog", label: "Blog" },
];

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const openMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-500 glass-navbar",
          scrolled && "shadow-lg"
        )}
      >
        <div className="container flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-8 min-w-0">
            <Logo />

            <nav className="hidden md:flex items-center space-x-6" aria-label="Principal">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-semibold tracking-wide transition-colors hover:text-primary whitespace-nowrap",
                    location.pathname === link.path ||
                      (link.path !== "/" && location.pathname.startsWith(link.path))
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <SearchButton />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden h-11 w-11"
              onClick={openMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </Button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} onClose={closeMenu} />
    </>
  );
};

export default Navbar;
