import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import SeoHead from "@/components/SeoHead";

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const body = [
      `Nome: ${name}`,
      `E-mail: ${email}`,
      '',
      message,
    ].join('\n');

    const mailto = `mailto:contato@deazons.com.br?subject=${encodeURIComponent(
      subject || 'Contato via Deazons'
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    toast({
      title: "Abrindo seu e-mail",
      description: "Se o app de e-mail não abrir, escreva para contato@deazons.com.br",
    });
    setIsSubmitting(false);
  };
  
  return (
    <div className="min-h-screen pt-8 pb-16">
      <SeoHead
        title="Contato | Deazons"
        description="Entre em contato com a equipe do Deazons. Tire suas dúvidas, dê sugestões ou envie seu feedback sobre nosso portal de filmes e séries."
        canonicalOverride="https://deazons.com/contato"
      />
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Entre em Contato</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="text-muted-foreground mb-6">
              Tem alguma dúvida, sugestão ou feedback sobre o Deazons? 
              Preencha o formulário e retornaremos o mais rápido possível.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">E-mail</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:contato@deazons.com.br" className="hover:text-primary transition-colors">
                    contato@deazons.com.br
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm">
                  Nome
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-1 text-sm">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block mb-1 text-sm">
                  Assunto
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Assunto da mensagem"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block mb-1 text-sm">
                  Mensagem
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={5}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
