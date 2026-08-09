import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import SeoHead from "@/components/SeoHead";
import { Mail, Copy, Check } from "lucide-react";

const CONTACT_EMAIL = "contato@deazons.com";

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const body = [
      `Nome: ${name}`,
      `E-mail de resposta: ${email}`,
      "",
      message,
    ].join("\n");

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject || "Contato via Deazons"
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    toast({
      title: "Abrindo seu e-mail",
      description: `Se nada abrir, envie para ${CONTACT_EMAIL}`,
    });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast({ title: "E-mail copiado", description: CONTACT_EMAIL });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copie manualmente",
        description: CONTACT_EMAIL,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-16 px-4">
      <SeoHead
        title="Contato | Deazons"
        description="Fale com a equipe do Deazons. Dúvidas, sugestões, parcerias ou feedback sobre filmes, séries e notícias."
        canonicalOverride="https://deazons.com/contato"
      />
      <div className="container max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Entre em Contato</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          Tem dúvida, sugestão, parceria ou feedback? Escreva para nós. Respondemos pelo e-mail oficial do site.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">E-mail oficial</h2>
                  <p className="text-sm text-muted-foreground">Resposta em horário comercial</p>
                </div>
              </div>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="block text-lg font-medium text-primary break-all hover:underline"
              >
                {CONTACT_EMAIL}
              </a>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild className="flex-1 min-h-[44px]">
                  <a href={`mailto:${CONTACT_EMAIL}`}>Abrir e-mail</a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[44px] gap-2"
                  onClick={copyEmail}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar e-mail"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Também pode usar o formulário ao lado — ele abre o app de e-mail do seu dispositivo com a mensagem pronta.
              </p>
              <p>
              Políticas:{" "}
              <Link to="/privacidade" className="text-primary hover:underline">Privacidade</Link>
              {" · "}
              <Link to="/termos" className="text-primary hover:underline">Termos</Link>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1.5 text-sm font-medium">
                Nome
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="min-h-[44px]"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-1.5 text-sm font-medium">
                Seu e-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="min-h-[44px]"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block mb-1.5 text-sm font-medium">
                Assunto
              </label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto da mensagem"
                required
                className="min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="message" className="block mb-1.5 text-sm font-medium">
                Mensagem
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={6}
                required
                className="min-h-[140px]"
              />
            </div>

            <Button type="submit" className="w-full min-h-[48px] text-base">
              Enviar por e-mail
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
