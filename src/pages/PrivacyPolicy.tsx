
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
            <p>
              Bem-vindo à Política de Privacidade do Deazons. Esta política explica como coletamos, 
              usamos, divulgamos, transferimos e armazenamos suas informações. Ao utilizar nosso site, 
              você concorda com a coleta e uso de informações de acordo com esta política.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Informações que Coletamos</h2>
            <p>
              <strong>Informações de uso:</strong> Coletamos informações sobre como você interage com nosso site, 
              incluindo as páginas que você visita, o tempo gasto no site, e outros dados de analytics.
            </p>
            <p>
              <strong>Cookies e tecnologias semelhantes:</strong> Utilizamos cookies e tecnologias similares para 
              melhorar sua experiência, analisar o tráfego e personalizar o conteúdo.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Como Usamos Suas Informações</h2>
            <p>Usamos as informações coletadas para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços;</li>
              <li>Entender como os usuários utilizam nosso site;</li>
              <li>Personalizar a experiência do usuário;</li>
              <li>Detectar, prevenir e resolver problemas técnicos;</li>
              <li>Cumprir obrigações legais.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Informações</h2>
            <p>
              Não vendemos ou alugamos suas informações pessoais a terceiros. Podemos compartilhar 
              informações com:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provedores de serviços que nos auxiliam na operação do site;</li>
              <li>Autoridades legais, quando requerido por lei.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Segurança</h2>
            <p>
              Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado, 
              alteração, divulgação ou destruição.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Seus Direitos</h2>
            <p>
              Você tem o direito de acessar, corrigir ou excluir seus dados pessoais. Para exercer estes direitos, 
              entre em contato conosco através dos meios fornecidos abaixo.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Alterações nesta Política</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer 
              alterações publicando a nova Política de Privacidade nesta página.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco em: 
              <Link to="/contato" className="text-deazon-400 hover:text-deazon-300 ml-1">
                página de contato
              </Link>.
            </p>
          </section>
        </div>
        
        <div className="mt-10 text-sm text-muted-foreground">
          <p>Última atualização: 20 de Abril de 2025</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
