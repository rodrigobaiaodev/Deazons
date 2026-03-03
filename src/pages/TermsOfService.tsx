
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Termos de Serviço</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o site Deazons, você concorda em cumprir e estar vinculado a estes 
              Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá 
              acessar o serviço.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descrição dos Serviços</h2>
            <p>
              O Deazons é uma plataforma que oferece informações sobre filmes, séries e 
              celebridades do entretenimento. Nosso conteúdo é fornecido principalmente através 
              da API do TMDB (The Movie Database).
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Uso do Serviço</h2>
            <p>Ao utilizar nossos serviços, você concorda em:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar o serviço apenas para fins legais e de acordo com estes Termos;</li>
              <li>Não usar o serviço para qualquer fim ilegal ou não autorizado;</li>
              <li>Não tentar prejudicar a operação normal do site ou sua infraestrutura;</li>
              <li>Não copiar, modificar, distribuir ou vender qualquer parte do serviço sem autorização expressa.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, recursos e funcionalidades disponíveis no Deazons são propriedade 
              do Deazons, seus licenciadores ou outros provedores de conteúdo e são protegidos por 
              leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
            <p>
              Os dados sobre filmes, séries e celebridades são fornecidos pela API do TMDB e 
              estão sujeitos aos termos e condições do TMDB.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Links para Outros Sites</h2>
            <p>
              Nosso serviço pode conter links para sites de terceiros que não são de propriedade 
              ou controlados pelo Deazons. O Deazons não tem controle sobre, e não assume 
              responsabilidade pelo conteúdo, políticas de privacidade ou práticas de quaisquer sites 
              ou serviços de terceiros.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Isenção de Garantias</h2>
            <p>
              Seu uso do serviço é por sua conta e risco. O serviço é fornecido "como está" e "conforme 
              disponível", sem garantias de qualquer tipo, expressas ou implícitas.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitação de Responsabilidade</h2>
            <p>
              Em nenhum caso o Deazons, seus diretores, funcionários ou agentes serão responsáveis 
              por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos 
              decorrentes do uso do site.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento. 
              É sua responsabilidade verificar periodicamente os termos para alterações.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
            <p>
              Se você tiver dúvidas sobre estes Termos, entre em contato conosco em: 
              <Link to="/contact" className="text-deazon-400 hover:text-deazon-300 ml-1">
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

export default TermsOfService;
