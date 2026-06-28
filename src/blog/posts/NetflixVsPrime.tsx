import { Link } from "react-router-dom";

export default function NetflixVsPrime({ images }: { images: any[] }) {
  const image2 = images[1]?.url || "https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=2670&auto=format&fit=crop";
  const image3 = images[2]?.url || "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2669&auto=format&fit=crop";

  return (
    <>
      <div className="bg-muted p-6 rounded-xl mb-10 border border-border">
        <h2 className="text-xl font-bold mb-4 mt-0 border-b border-border/50 pb-2">Índice</h2>
        <ul className="space-y-2 mb-0 list-none pl-0">
          <li><a href="#introducao" className="no-underline hover:underline">1. Introdução: O Cenário do Streaming em 2025</a></li>
          <li><a href="#netflix" className="no-underline hover:underline">2. Netflix: O Gigante Original</a></li>
          <li><a href="#prime" className="no-underline hover:underline">3. Amazon Prime Video: O Melhor Custo-Benefício</a></li>
          <li><a href="#disney" className="no-underline hover:underline">4. Disney+: A Casa das Grandes Franquias</a></li>
          <li><a href="#comparativo" className="no-underline hover:underline">5. Tabela Comparativa de Preços e Recursos</a></li>
          <li><a href="#conclusao" className="no-underline hover:underline">6. Veredito: Qual Você Deve Assinar?</a></li>
          <li><a href="#faq" className="no-underline hover:underline">7. Perguntas Frequentes (FAQ)</a></li>
        </ul>
      </div>

      <h2 id="introducao">1. Introdução: O Cenário do Streaming em 2025</h2>
      <p>
        A guerra dos streamings nunca esteve tão acirrada. Com aumentos constantes de preços, restrições de compartilhamento de senhas e a introdução de planos com anúncios, o consumidor de 2025 se depara com uma difícil decisão: <strong>qual serviço realmente vale o investimento mensal?</strong>
      </p>
      <p>
        Se há alguns anos era comum assinar três ou quatro plataformas simultaneamente, a fragmentação do mercado e a inflação forçaram muitos lares a adotarem a estratégia de "rotação" (assinar um serviço por mês) ou eleger uma única plataforma principal. Neste guia definitivo, vamos analisar profundamente os três principais gigantes do mercado brasileiro: <strong>Netflix, Amazon Prime Video e Disney+</strong>.
      </p>

      <h2 id="netflix">2. Netflix: O Gigante Original</h2>
      <p>
        A Netflix continua sendo a sinônimo de streaming para a maioria das pessoas. Mesmo após polêmicas decisões corporativas, sua base de assinantes permanece sólida. Mas o que mantém a Netflix no topo?
      </p>
      
      <h3>Pontos Fortes da Netflix</h3>
      <ul>
        <li><strong>Volume de Lançamentos:</strong> Nenhuma outra plataforma lança tantas produções originais semanalmente. Se você quer estar sempre assistindo à "série do momento" comentada no trabalho e no Twitter, a Netflix é indispensável.</li>
        <li><strong>Algoritmo Superior:</strong> A interface de usuário (UI) e o algoritmo de recomendação da Netflix ainda são imbatíveis. A plataforma entende seus gostos e oferece uma experiência de navegação fluida, sem os travamentos comuns na concorrência.</li>
        <li><strong>Diversidade Internacional:</strong> Séries coreanas (Doramas), espanholas, produções turcas e documentários impecáveis. A Netflix investe pesado no cinema global.</li>
      </ul>

      <h3>Pontos Fracos</h3>
      <ul>
        <li><strong>Preço Elevado:</strong> O plano Premium 4K da Netflix se tornou um dos mais caros do mercado, e o plano básico foi substituído pelo plano com anúncios, que nem sempre agrada o consumidor exigente.</li>
        <li><strong>Cancelamentos Prematuros:</strong> A fama da Netflix de cancelar séries excelentes na primeira ou segunda temporada (a infame "maldição da Netflix") frustra muitos assinantes que investem tempo em uma nova história.</li>
        <li><strong>Bloqueio de Senhas:</strong> A taxa extra para assinantes fora da mesma residência tornou a divisão de contas impossível sem custos adicionais.</li>
      </ul>

      <figure className="my-10">
        <img src={image2} alt="Pessoa assistindo streaming na TV" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">A experiência de usuário da Netflix ainda é considerada a melhor do mercado.</figcaption>
      </figure>

      <h2 id="prime">3. Amazon Prime Video: O Melhor Custo-Benefício</h2>
      <p>
        O Prime Video tem uma vantagem desleal sobre seus concorrentes: ele faz parte de um ecossistema gigantesco. A assinatura não entrega apenas filmes e séries, mas frete grátis na Amazon, Prime Music, Prime Reading e jogos gratuitos mensais via Prime Gaming.
      </p>

      <h3>O que o Prime Video faz bem</h3>
      <ul>
        <li><strong>Séries Autorais de Peso:</strong> Produções como <em>The Boys</em>, <em>Invincible</em>, <em>O Senhor dos Anéis: Os Anéis de Poder</em> e <em>Fallout</em> provaram que a Amazon não brinca em serviço quando o assunto é orçamento e qualidade de produção.</li>
        <li><strong>Integração com Canais:</strong> A possibilidade de assinar canais adicionais (como Max, Paramount+ e Telecine) dentro da mesma interface transforma o Prime Video em um excelente hub central.</li>
        <li><strong>Custo Benefício Imbatível:</strong> O valor do Prime no Brasil, considerando todos os benefícios agregados de entrega, é indiscutivelmente o melhor negócio disponível no mercado atualmente.</li>
      </ul>

      <h3>Onde o Prime Video peca</h3>
      <ul>
        <li><strong>Interface Confusa:</strong> Apesar das recentes atualizações, a interface mistura conteúdo gratuito com filmes para aluguel ou compra, o que gera frustração constante ("Cliquei para assistir e tenho que pagar R$14,90?").</li>
        <li><strong>Catálogo Flutuante:</strong> Filmes excelentes entram e saem do catálogo sem muito aviso prévio, e as produções originais são lançadas em um ritmo bem mais lento que a Netflix.</li>
      </ul>

      <h2 id="disney">4. Disney+: A Casa das Grandes Franquias</h2>
      <p>
        Em 2024, a Disney tomou uma decisão drástica no Brasil: fundir o Star+ com o Disney+. Agora, o serviço abriga não apenas princesas e heróis, mas esportes ao vivo (ESPN), séries adultas (The Bear, Shogun) e todo o acervo da Fox.
      </p>

      <h3>Por que assinar o Disney+?</h3>
      <ul>
        <li><strong>O Paraíso dos Fãs:</strong> Se você ama Marvel, Star Wars, Pixar ou clássicos da Disney, esta é a única opção oficial. É o catálogo definitivo da nostalgia e da cultura pop.</li>
        <li><strong>Transmissões Esportivas:</strong> A inclusão da ESPN mudou o jogo. Poder assistir à Premier League, NBA e NFL no mesmo aplicativo onde você assiste a <em>Os Simpsons</em> é um diferencial massivo.</li>
        <li><strong>Qualidade Técnica:</strong> O Disney+ oferece excelente suporte a IMAX Enhanced, Dolby Vision e Dolby Atmos, agradando os puristas de áudio e vídeo que possuem bons home theaters.</li>
      </ul>

      <h3>Os contras do Disney+</h3>
      <ul>
        <li><strong>Aumentos de Preço Pós-Fusão:</strong> A unificação com o Star+ trouxe um aumento significativo no valor da assinatura mensal, afastando usuários que só queriam o conteúdo infantil.</li>
        <li><strong>Falta de Variedade Fora das Franquias:</strong> Se tirarmos Marvel, Star Wars e animações, as produções originais (fora do selo FX) muitas vezes não geram o mesmo engajamento cultural que os sucessos da Netflix ou HBO.</li>
      </ul>

      <figure className="my-10">
        <img src={image3} alt="Dispositivos mostrando tela de streaming" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">A união do Star+ com Disney+ criou um dos catálogos mais fortes do mercado de streaming.</figcaption>
      </figure>

      <h2 id="comparativo">5. Tabela Comparativa de Preços e Recursos (Atualizado 2025)</h2>
      <div className="overflow-x-auto my-8">
        <table className="min-w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left">Serviço</th>
              <th className="border border-border p-3 text-left">Plano Básico (Mensal)</th>
              <th className="border border-border p-3 text-left">Qualidade de Vídeo (Máxima)</th>
              <th className="border border-border p-3 text-left">Telas Simultâneas</th>
              <th className="border border-border p-3 text-left">Forte Principal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-3 font-semibold">Netflix</td>
              <td className="border border-border p-3">R$ 20,90 (Com Anúncios) / R$ 59,90 (4K)</td>
              <td className="border border-border p-3">4K HDR / Dolby Vision</td>
              <td className="border border-border p-3">Até 4 (Plano Premium)</td>
              <td className="border border-border p-3">Variedade, Doramas e Algoritmo</td>
            </tr>
            <tr>
              <td className="border border-border p-3 font-semibold">Prime Video</td>
              <td className="border border-border p-3">R$ 19,90 (Inclui frete grátis Amazon)</td>
              <td className="border border-border p-3">4K HDR</td>
              <td className="border border-border p-3">Até 3</td>
              <td className="border border-border p-3">Custo-benefício e Séries Autorais (The Boys)</td>
            </tr>
            <tr>
              <td className="border border-border p-3 font-semibold">Disney+</td>
              <td className="border border-border p-3">R$ 43,90 (Padrão) / R$ 62,90 (Premium)</td>
              <td className="border border-border p-3">4K UHD / IMAX Enhanced</td>
              <td className="border border-border p-3">Até 4</td>
              <td className="border border-border p-3">Marvel, Star Wars, Pixar e Esportes (ESPN)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="conclusao">6. Veredito: Qual Você Deve Assinar?</h2>
      <p>
        A decisão final depende puramente do seu perfil como espectador:
      </p>
      <ul>
        <li><strong>Vá de Netflix se:</strong> Você gosta de estar por dentro das tendências globais, adora documentários de "true crime", consome séries asiáticas ou prefere uma interface impecável para usar do celular à Smart TV.</li>
        <li><strong>Vá de Prime Video se:</strong> Seu orçamento é o fator principal. Os R$ 19,90 pagos não são apenas pelo streaming, mas pelas compras na Amazon. É a escolha mais inteligente financeiramente e ainda oferece pérolas absolutas como <em>The Boys</em>.</li>
        <li><strong>Vá de Disney+ se:</strong> Você tem filhos pequenos (Pixar/Disney), é fã de cultura pop (Marvel/Star Wars) ou não vive sem assistir ao seu time europeu de futebol jogar no final de semana pela ESPN.</li>
      </ul>
      <p>
        Lembre-se que você sempre pode buscar filmes específicos diretamente no nosso portal. Acesse a área de <Link to="/filmes" className="font-bold text-primary">Filmes</Link> do Deazons e veja em qual plataforma o seu filme favorito está passando hoje!
      </p>

      <div className="bg-muted p-8 rounded-xl mt-12 border border-border">
        <h2 id="faq" className="mt-0 mb-6">7. Perguntas Frequentes (FAQ)</h2>
        
        <h3 className="text-lg font-bold mb-2">Posso dividir a conta da Netflix com amigos em 2025?</h3>
        <p className="mb-4 text-muted-foreground">Não gratuitamente. A Netflix rastreia o IP e o Wi-Fi da residência principal. Para adicionar um assinante extra que mora em outra casa, é cobrada uma taxa adicional de R$ 12,90 por mês por usuário extra.</p>
        
        <h3 className="text-lg font-bold mb-2">O Prime Video cobra por filmes à parte?</h3>
        <p className="mb-4 text-muted-foreground">Sim e não. O catálogo incluso na sua assinatura ("Prime") é gratuito. Porém, a Amazon também atua como locadora digital, oferecendo filmes recém-saídos do cinema para aluguel (cerca de R$ 14,90), que ficam disponíveis por 48 horas após o play.</p>
        
        <h3 className="text-lg font-bold mb-2">O Star+ acabou? Onde foram parar as séries?</h3>
        <p className="mb-4 text-muted-foreground">Sim. A Disney descontinuou o aplicativo do Star+ na América Latina e migrou todo o seu conteúdo adulto (como The Bear, Os Simpsons, Deadpool) e transmissões da ESPN para dentro do aplicativo único do Disney+.</p>
        
        <h3 className="text-lg font-bold mb-2">Qual streaming tem a melhor qualidade de imagem?</h3>
        <p className="mb-4 text-muted-foreground">Tecnicamente, o Disney+ e a Max (HBO) lideram no quesito bitrate (taxa de dados). O Disney+ oferece filmes da Marvel em formato IMAX Enhanced, que removem as barras pretas, entregando a melhor experiência para TVs de alta definição.</p>
        
        <h3 className="text-lg font-bold mb-2">Vale a pena assinar o plano com anúncios da Netflix?</h3>
        <p className="mb-4 text-muted-foreground">Depende da sua tolerância. Ele é bem mais barato (R$ 20,90), mas exibe de 4 a 5 minutos de anúncios por hora e bloqueia o download de títulos para assistir offline, além de restringir a qualidade a 1080p.</p>
      </div>
    </>
  );
}
