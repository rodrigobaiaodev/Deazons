import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  const handleDismiss = () => {
    // Fecha sem gravar aceite — banner pode reaparecer na próxima visita
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur border-t border-border">
      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-card-foreground text-center sm:text-left">
          Usamos cookies e o Google Analytics para entender o uso do site. Ao clicar em Aceitar, você concorda com nossa{' '}
          <Link to="/privacidade" className="underline text-primary hover:text-primary/80">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDismiss} className="min-w-[100px]">
            Agora não
          </Button>
          <Button onClick={handleAccept} className="min-w-[120px]">
            Aceitar
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar banner de cookies"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
