import { Link } from "react-router-dom";

export default function GuiaNetflix2025({ images }: { images: any[] }) {
  const image2 = images[1]?.url || "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2669&auto=format&fit=crop";
  const image3 = images[2]?.url || "https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=2670&auto=format&fit=crop";

  return (
    <>
      <div className="bg-muted p-6 rounded-xl mb-10 border border-border">
        <h2 className="text-xl font-bold mb-4 mt-0 border-b border-border/50 pb-2">Índice</h2>
        <ul className="space-y-2 mb-0 list-none pl-0">
          <li><a href="#panorama" className="no-underline hover:underline">1. Panorama da Netflix em 2025</a></li>
          <li><a href="#planos" className="no-underline hover:underline">2. Todos os Planos e Preços Atuais</a></li>
          <li><a href="#anuncios" className="no-underline hover:underline">3. Plano com Anúncios: Vale ou Não Vale?</a></li>
          <li><a href="#senha" className="no-underline hover:underline">4. O Bloqueio de Compartilhamento de Senha</a></li>
          <li><a href="#catalogo" className="no-underline hover:underline">5. O Catálogo: Pontos Fortes e Fracos</a></li>
          <li><a href="#alternativas" className="no-underline hover:underline">6. Alternativas à Netflix em 2025</a></li>
          <li><a href="#veredicto" className="no-underline hover:underline">7. Veredito Final: Assine ou Cancele?</a></li>
          <li><a href="#faq" className="no-underline hover:underline">8. Perguntas Frequentes (FAQ)</a></li>
        </ul>
      </div>

      <h2 id="panorama">1. Panorama da Netflix em 2025: O Gigante Ainda é Gigante?</h2>
      <p>
        Em 2025, a Netflix completa 27 anos de existência e mais de 15 anos operando o modelo de streaming que revolucionou o entretenimento global. Com mais de <strong>260 milhões de assinantes pagantes em todo o mundo</strong>, a plataforma continua sendo, de longe, o maior serviço de vídeo sob demanda do planeta — mas a hegemonia tranquila do passado deu lugar a um presente muito mais turbulento.
      </p>
      <p>
        A empresa que já chegou a perder 1 milhão de assinantes em um único trimestre (2022), forçando uma reinvenção radical do negócio, hoje sustenta sua liderança com três pilares que vêm funcionando melhor do que os críticos esperavam: o <strong>plano com publicidade</strong>, o <strong>combate ao compartilhamento de senhas</strong> e um investimento constante em <strong>conteúdo local ao redor do mundo</strong>. Mas será que isso é suficiente para justificar os preços praticados no mercado brasileiro em 2025?
      </p>
      <p>
        Neste guia, vamos analisar cada detalhe da Netflix atual — planos, preços, catálogo, restrições e comparações — para você decidir com clareza se a assinatura ainda faz sentido para o seu perfil.
      </p>

      <h2 id="planos">2. Todos os Planos e Preços da Netflix em 2025</h2>
      <p>
        A estrutura de planos da Netflix passou por reformulações significativas nos últimos anos. O antigo "Plano Básico" sem anúncios foi descontinuado para novos assinantes, e hoje a grade é a seguinte:
      </p>

      <div className="overflow-x-auto my-8">
        <table className="min-w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left">Plano</th>
              <th className="border border-border p-3 text-left">Preço Mensal (BR)</th>
              <th className="border border-border p-3 text-left">Qualidade</th>
              <th className="border border-border p-3 text-left">Telas Simultâneas</th>
              <th className="border border-border p-3 text-left">Downloads</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-3 font-semibold">Com Anúncios</td>
              <td className="border border-border p-3">R$ 20,90</td>
              <td className="border border-border p-3">1080p Full HD</td>
              <td className="border border-border p-3">2 telas</td>
              <td className="border border-border p-3">Não disponível</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="border border-border p-3 font-semibold">Padrão</td>
              <td className="border border-border p-3">R$ 44,90</td>
              <td className="border border-border p-3">1080p Full HD</td>
              <td className="border border-border p-3">2 telas</td>
              <td className="border border-border p-3">Sim (2 dispositivos)</td>
            </tr>
            <tr>
              <td className="border border-border p-3 font-semibold">Premium</td>
              <td className="border border-border p-3">R$ 59,90</td>
              <td className="border border-border p-3">4K UHD + HDR + Dolby Atmos</td>
              <td className="border border-border p-3">4 telas</td>
              <td className="border border-border p-3">Sim (6 dispositivos)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Além disso, o plano Padrão e o Premium permitem adicionar <strong>membro extra</strong> (uma conta fora da sua residência) por R$ 12,90 por mês, por pessoa. É a solução oficial da Netflix para o compartilhamento de senhas — uma funcionalidade que gerou polêmica, mas que já foi aceita pela grande maioria dos usuários.
      </p>

      <h2 id="anuncios">3. Plano com Anúncios: Vale ou Não Vale?</h2>
      <p>
        O plano mais barato da Netflix, a R$ 20,90, existe desde novembro de 2022 e finalmente ganhou maturidade em 2025. É a opção mais debatida entre os assinantes, e a resposta sobre valer ou não depende diretamente do seu perfil de uso.
      </p>

      <h3>O que você tolera em troca da economia?</h3>
      <p>
        No plano com anúncios, a Netflix exibe uma média de <strong>4 a 5 minutos de publicidade por hora</strong> de conteúdo. Os anúncios são inseridos antes e durante o programa, de forma similar ao que acontece em canais abertos. Além disso:
      </p>
      <ul>
        <li><strong>Qualidade máxima é 1080p</strong> (não há 4K disponível nesse plano).</li>
        <li><strong>Downloads offline não são permitidos</strong> — você não pode salvar episódios para assistir no avião ou em locais sem internet.</li>
        <li><strong>Alguns títulos são bloqueados</strong> por questões de licenciamento e não aparecem para esse plano (geralmente uma minoria do catálogo).</li>
        <li>A Netflix <strong>coleta dados de uso para personalizar anúncios</strong> — um ponto de privacidade que incomoda alguns usuários.</li>
      </ul>

      <h3>Para quem o plano com anúncios faz sentido?</h3>
      <ul>
        <li>Quem assiste à Netflix de forma casual, sem maratonar horas seguidas e sem usar downloads offline.</li>
        <li>Famílias que querem o serviço para os filhos assistirem a animações e conteúdo infantil (que geralmente é livre de anúncios).</li>
        <li>Quem tem orçamento restrito e prefere pagar menos mesmo que a experiência não seja perfeita.</li>
      </ul>

      <figure className="my-10">
        <img src={image2} alt="Pessoa assistindo Netflix na Smart TV da sala" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">A experiência da Netflix varia bastante dependendo do plano escolhido — especialmente no quesito qualidade de vídeo.</figcaption>
      </figure>

      <h2 id="senha">4. O Bloqueio de Compartilhamento de Senha: O Que Mudou de Verdade?</h2>
      <p>
        A medida mais controversa da história recente da Netflix foi implementada em 2023 e está plenamente em vigor em 2025. O compartilhamento de senha entre residências diferentes foi encerrado, e a plataforma usa tecnologia de IP e Wi-Fi para detectar o seu "local de residência principal".
      </p>
      <p>
        Na prática, funciona assim: a sua conta tem uma "Casa Netflix" definida pela rede Wi-Fi onde você faz login com mais frequência. Qualquer dispositivo que se conecte de outro endereço por mais de 31 dias consecutivos receberá um aviso para se verificar — e, eventualmente, não conseguirá mais acessar a conta.
      </p>
      <h3>A saída oficial: Membro Extra</h3>
      <p>
        A Netflix criou a funcionalidade "Membro Extra" para monetizar o compartilhamento. Pelos planos Padrão e Premium, você pode adicionar <strong>até 1 perfil extra</strong>, com login independente, por R$ 12,90 mensais. Esse perfil tem seus próprios histórico, senha e recomendações, mas não pode ser usado no mesmo horário que os usuários principais se o número de telas simultâneas já estiver esgotado.
      </p>

      <h2 id="catalogo">5. O Catálogo da Netflix em 2025: Pontos Fortes e Fracos</h2>

      <h3>O que a Netflix faz melhor que todos</h3>
      <ul>
        <li><strong>Conteúdo Original Internacional:</strong> A Netflix é a única plataforma que investe em produções originais em todos os continentes com resultados consistentes. Séries como <em>Round 6</em> (Coreia), <em>Lupin</em> (França), <em>The Crown</em> (Reino Unido) e <em>3%</em> (Brasil) são exemplos de como essa estratégia funciona globalmente.</li>
        <li><strong>Documentários e True Crime:</strong> Nenhum serviço chega perto da Netflix no volume e qualidade de documentários. Séries como <em>Making a Murderer</em>, <em>The Tinder Swindler</em> e <em>Wild Wild Country</em> definiram o gênero.</li>
        <li><strong>Variedade de Formatos:</strong> Stand-up comedy, filmes interativos (como Bandersnatch), reality shows, animações adultas (Big Mouth, Arcane) e anime. A Netflix cobre virtualmente todos os nichos.</li>
      </ul>

      <h3>As fraquezas que os concorrentes exploram</h3>
      <ul>
        <li><strong>A "Maldição dos Cancelamentos":</strong> A Netflix tem histórico de cancelar séries com boa audiência após 2 ou 3 temporadas por critérios de ROI (retorno sobre investimento) que priorizam o custo de renovação em relação ao engajamento de longo prazo. Séries como <em>Mindhunter</em>, <em>Marco Polo</em> e <em>Sense8</em> deixaram fãs órfãos.</li>
        <li><strong>Ausência de Blockbusters Recentes:</strong> A Netflix raramente tem os filmes mais recentes do cinema nos primeiros meses de lançamento. Para assistir aos últimos lançamentos da Marvel ou DC logo após o cinema, você precisará do Disney+ ou Prime Video.</li>
        <li><strong>Esportes ao Vivo:</strong> Até 2025, a Netflix ainda engatinha nesse segmento. Embora tenha transmitido alguns eventos de boxe e a Fórmula 1 em mercados selecionados, o Disney+ (ESPN) e o Prime Video dominam essa categoria.</li>
      </ul>

      <figure className="my-10">
        <img src={image3} alt="Casal assistindo streaming confortavelmente no sofá" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">A decisão de assinar ou não a Netflix em 2025 depende muito do tipo de conteúdo que você consome com mais frequência.</figcaption>
      </figure>

      <h2 id="alternativas">6. As Melhores Alternativas à Netflix em 2025</h2>
      <p>
        Antes de decidir sobre a Netflix, vale conhecer o cenário competitivo atual para tomar uma decisão informada:
      </p>
      <ul>
        <li><strong>Amazon Prime Video (R$ 19,90/mês):</strong> Melhor custo-benefício do mercado, com <em>The Boys</em>, <em>Fallout</em>, <em>Reacher</em> e o ecossistema de benefícios Amazon. Ideal para quem é cliente da Amazon.</li>
        <li><strong>Disney+ (R$ 43,90/mês):</strong> Essencial para fãs de Marvel, Star Wars, Pixar e para quem quer esportes via ESPN. O conteúdo do antigo Star+ (FX, National Geographic, The Bear) é um bônus enorme.</li>
        <li><strong>Max/HBO (R$ 34,90/mês):</strong> A melhor plataforma em termos de <em>qualidade média</em> por título. Com <em>The Last of Us</em>, <em>Succession</em>, <em>House of the Dragon</em> e o acervo completo da HBO, é a escolha do cinéfilo exigente.</li>
        <li><strong>Globoplay (R$ 22,90/mês):</strong> Única opção com novelas ao vivo, telejornais e futebol pelo Campeonato Brasileiro (em alguns planos). Essencial para o consumidor de conteúdo nacional.</li>
      </ul>

      <h2 id="veredicto">7. Veredito Final: Assine, Mantenha ou Cancele a Netflix em 2025?</h2>
      <p>
        A resposta honesta é que <strong>depende do seu perfil</strong>, mas aqui estão os cenários claros:
      </p>
      <ul>
        <li><strong>Assine (ou mantenha) se:</strong> Você consome conteúdo de forma intensa e variada; gosta de estar por dentro das séries e documentários que todo mundo está comentando; tem filhos e precisa de conteúdo infantil de qualidade; ou usa a plataforma em grupo com a funcionalidade de membro extra.</li>
        <li><strong>Reconsidere se:</strong> Você está pagando pelo Plano Premium sozinho e usa apenas 1 tela — nesse caso, o Plano Padrão oferece o mesmo conteúdo por R$ 15 menos. O upgrade para 4K só vale a pena se você tiver uma TV compatível e assistir a muito conteúdo.</li>
        <li><strong>Cancele se:</strong> Você percebe que fica semanas sem abrir o app, ou seu consumo se concentra exclusivamente em séries de uma única plataforma rival. A estratégia de rotação (assinar por 1-2 meses, maratonar tudo que quer ver e cancelar) é perfeitamente válida e economicamente inteligente.</li>
      </ul>
      <p>
        Independente da plataforma escolhida, você pode pesquisar qualquer filme ou série diretamente no <Link to="/filmes" className="font-bold text-primary">catálogo do Deazons</Link> para descobrir onde ele está disponível antes de assinar qualquer serviço.
      </p>

      <div className="bg-muted p-8 rounded-xl mt-12 border border-border">
        <h2 id="faq" className="mt-0 mb-6">8. Perguntas Frequentes (FAQ)</h2>

        <h3 className="text-lg font-bold mb-2">A Netflix está mais cara ou mais barata em 2025 do que em 2020?</h3>
        <p className="mb-4 text-muted-foreground">Mais cara, em termos absolutos. O plano Premium chegou a custar R$ 39,90 em 2020; hoje custa R$ 59,90. Porém, com a criação do plano com anúncios a R$ 20,90, o ponto de entrada no serviço ficou mais barato do que jamais foi, o que equilibra o cenário para novos assinantes.</p>

        <h3 className="text-lg font-bold mb-2">Posso cancelar a Netflix a qualquer momento?</h3>
        <p className="mb-4 text-muted-foreground">Sim. A Netflix não tem fidelidade mínima. Você cancela quando quiser pelo próprio app ou site, e o acesso continua até o fim do período pago. Não há multa nem cobrança extra pelo cancelamento.</p>

        <h3 className="text-lg font-bold mb-2">A Netflix tem conteúdo infantil de qualidade?</h3>
        <p className="mb-4 text-muted-foreground">Sim, bastante. Séries como <em>Spirit: Cavalgando Livre</em>, <em>Ada Twist</em>, <em>Dinotrux</em> e filmes originais de animação fazem da Netflix uma das melhores opções para crianças. O modo "Perfil Infantil" bloqueia automaticamente qualquer conteúdo impróprio para menores.</p>

        <h3 className="text-lg font-bold mb-2">A qualidade 4K da Netflix é boa?</h3>
        <p className="mb-4 text-muted-foreground">Sim, mas com ressalvas. A Netflix usa a tecnologia de compressão VP9 e AV1, que entregam boa qualidade visual, mas com um bitrate (taxa de dados) geralmente menor do que Disney+ ou Max. Para a grande maioria das TVs e condições de uso, a diferença é imperceptível, mas puristas de vídeo que têm TVs OLED de última geração podem perceber a distinção.</p>

        <h3 className="text-lg font-bold mb-2">A Netflix funciona em quantos dispositivos diferentes?</h3>
        <p className="mb-4 text-muted-foreground">Você pode baixar o aplicativo e fazer login em quantos dispositivos quiser, mas o número de <em>streams simultâneos</em> é limitado pelo plano: 2 telas para os planos Com Anúncios e Padrão, e 4 telas para o Premium. O histórico e os perfis funcionam em todos os dispositivos vinculados.</p>
      </div>
    </>
  );
}
