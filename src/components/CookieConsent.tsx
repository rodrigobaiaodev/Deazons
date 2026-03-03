
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur border-t border-border">
      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-card-foreground text-center sm:text-left">
          Este site usa cookies para garantir a melhor experiência de navegação. Ao continuar, você concorda com o uso de cookies.
        </p>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleAccept}
            className="min-w-[120px]"
          >
            Aceitar
          </Button>
          <button
            onClick={handleAccept}
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
