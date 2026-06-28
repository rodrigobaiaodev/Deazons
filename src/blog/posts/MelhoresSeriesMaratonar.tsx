import { Link } from "react-router-dom";

export default function MelhoresSeriesMaratonar({ images }: { images: any[] }) {
  const image2 = images[1]?.url || "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=2670&auto=format&fit=crop";
  const image3 = images[2]?.url || "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=2670&auto=format&fit=crop";

  return (
    <>
      <div className="bg-muted p-6 rounded-xl mb-10 border border-border">
        <h2 className="text-xl font-bold mb-4 mt-0 border-b border-border/50 pb-2">Índice</h2>
        <ul className="space-y-2 mb-0 list-none pl-0">
          <li><a href="#introducao" className="no-underline hover:underline">1. Introdução: A Arte do Binge-Watching</a></li>
          <li><a href="#suspense" className="no-underline hover:underline">2. Séries de Suspense e Mistério</a></li>
          <li><a href="#comedia" className="no-underline hover:underline">3. Comédias Leves (Comfort Shows)</a></li>
          <li><a href="#ficcao" className="no-underline hover:underline">4. Ficção Científica e Fantasia</a></li>
          <li><a href="#dramas" className="no-underline hover:underline">5. Dramas Aclamados pela Crítica</a></li>
          <li><a href="#dicas" className="no-underline hover:underline">6. Dicas para uma Maratona Perfeita</a></li>
          <li><a href="#faq" className="no-underline hover:underline">7. Perguntas Frequentes (FAQ)</a></li>
        </ul>
      </div>

      <h2 id="introducao">1. Introdução: A Arte do Binge-Watching</h2>
      <p>
        Existe algo mágico em encontrar aquela série perfeita que te prende do primeiro ao último episódio. O famoso <em>binge-watching</em> (ou maratonar) deixou de ser um evento raro para se tornar a forma principal como consumimos televisão no século 21. 
      </p>
      <p>
        Porém, com a enxurrada de novos lançamentos semanais em múltiplos serviços de streaming, o temido "paradoxo da escolha" entra em ação: passamos mais tempo escolhendo o que assistir do que efetivamente assistindo. Para resolver isso, separamos as séries mais viciantes, divididas por categorias, para garantir que o seu final de semana no sofá seja inesquecível.
      </p>

      <h2 id="suspense">2. Séries de Suspense e Mistério (Para não desgrudar da tela)</h2>
      <p>
        Se a sua intenção é não conseguir dormir enquanto não descobrir quem é o assassino ou qual é a grande reviravolta, o gênero de suspense é a escolha certeira.
      </p>
      
      <h3>Ruptura (Severance) - Apple TV+</h3>
      <p>
        Imagine se você pudesse separar cirurgicamente as memórias do seu trabalho das memórias da sua vida pessoal. Quando você está no escritório, não sabe quem é fora dele. Quando está em casa, não lembra do que faz no trabalho. <strong>Ruptura</strong> pega essa premissa brilhante de ficção científica corporativa e a transforma no suspense mais eletrizante e tenso dos últimos anos. O final da primeira temporada é, sem exageros, um dos maiores "cliffhangers" da história da TV.
      </p>

      <h3>Stranger Things - Netflix</h3>
      <p>
        A carta de amor aos anos 80 criada pelos Irmãos Duffer dispensa apresentações. Mas por que ela é tão maratonável? A mistura perfeita de aventura juvenil estilo <em>Goonies</em>, mistério estilo <em>Stephen King</em> e efeitos especiais dignos de blockbusters faz com que as horas passem voando enquanto você acompanha a saga de Eleven e seus amigos contra o Mundo Invertido.
      </p>

      <h3>Dark - Netflix</h3>
      <p>
        Esta produção alemã exige atenção total. É um quebra-cabeça temporal denso sobre quatro famílias em uma pequena cidade onde crianças começam a desaparecer. A série tem apenas três temporadas, com começo, meio e fim perfeitamente amarrados. Se você piscar, vai perder um detalhe crucial de quem é quem (e de "quando" é quem).
      </p>

      <figure className="my-10">
        <img src={image2} alt="Pipoca e controle remoto na frente da TV" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">Suspense é o gênero favorito de 60% das pessoas que maratonam séries no Brasil.</figcaption>
      </figure>

      <h2 id="comedia">3. Comédias Leves (Comfort Shows)</h2>
      <p>
        Às vezes, a semana de trabalho foi tão pesada que a última coisa que você quer é ver um drama pesado. Os <em>comfort shows</em> (séries de conforto) são aquelas comédias de 20 minutos por episódio que abraçam a alma.
      </p>

      <h3>The Office (US) - Prime Video / Netflix</h3>
      <p>
        A rotina da Dunder Mifflin Paper Company. O humor constrangedor e brilhante liderado por Steve Carell (Michael Scott) demora cerca de 5 episódios para realmente engrenar, mas quando engrena, você devora as 9 temporadas. É a série perfeita para colocar de fundo enquanto come ou descansa.
      </p>

      <h3>Brooklyn Nine-Nine - Netflix</h3>
      <p>
        Acompanhe o imaturo porém brilhante detetive Jake Peralta e o robótico Capitão Holt na 99ª delegacia de Nova York. A química do elenco é fenomenal, e a série aborda temas importantes sem perder o foco em ser hilária. O episódio anual do "Roubo de Halloween" sozinho já vale a maratona.
      </p>
      
      <h3>Ted Lasso - Apple TV+</h3>
      <p>
        A série mais "boa praça" da televisão atual. Um treinador de futebol americano é contratado para treinar um time de futebol (soccer) na Inglaterra com o objetivo de destruí-lo. Mas o otimismo implacável e a empatia de Ted Lasso mudam a vida de todos ao seu redor. É impossível não sorrir assistindo.
      </p>

      <h2 id="ficcao">4. Ficção Científica e Fantasia</h2>
      <p>
        Para quem gosta de fugir completamente da realidade, mundos inventados com lore profunda são a melhor pedida.
      </p>

      <h3>Game of Thrones & A Casa do Dragão - Max</h3>
      <p>
        Mesmo com as controvérsias das últimas temporadas, assistir às primeiras 6 temporadas de Game of Thrones, de uma só vez (sem ter que esperar um ano entre as temporadas como o público original), é uma das experiências mais épicas que o audiovisual oferece. Logo depois, pule para o spin-off <em>A Casa do Dragão</em> para mais intrigas políticas e, claro, dragões queimando tudo.
      </p>

      <h3>The Boys - Prime Video</h3>
      <p>
        E se os super-heróis da Marvel ou DC existissem no mundo real, mas fossem celebridades mimadas, corruptas e psicopatas controlados por uma megacorporação? <em>The Boys</em> é violenta, ácida, chocante e incrivelmente engraçada. Não é para quem tem estômago fraco, mas é vício na certa.
      </p>

      <figure className="my-10">
        <img src={image3} alt="Sala escura com TV tela plana iluminada" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">Mergulhar em mundos fantásticos requer horas contínuas de imersão.</figcaption>
      </figure>

      <h2 id="dramas">5. Dramas Aclamados pela Crítica</h2>
      <p>
        A Era de Ouro da TV nos presenteou com obras que superam muitos filmes indicados ao Oscar.
      </p>

      <h3>Breaking Bad - Netflix</h3>
      <p>
        A transformação do pacato professor de química Walter White no temível barão da metanfetamina Heisenberg. A série escala perfeitamente: a primeira temporada é contida, enquanto as últimas são uma montanha-russa de tensão. É unanimidade entre críticos como a melhor série já feita.
      </p>

      <h3>Succession - Max</h3>
      <p>
        Imagine Shakespeare moderno com muito dinheiro e humor sombrio. A família Roy, bilionários donos de um império de mídia global, luta internamente para ver quem vai suceder o tirânico patriarca Logan Roy. O texto e as atuações (especialmente de Jeremy Strong, Kieran Culkin e Sarah Snook) ganharam basicamente todos os prêmios Emmy recentes.
      </p>

      <h2 id="dicas">6. Dicas para uma Maratona Perfeita</h2>
      <ul>
        <li><strong>A Regra dos 3 Episódios:</strong> Se a série tem episódios de 1 hora, assista até o final do terceiro antes de desistir. Muitos pilotos são apenas introdução (ex: Breaking Bad, Game of Thrones).</li>
        <li><strong>Alongue-se:</strong> Parece besteira, mas fazer 5 minutos de alongamento a cada 2 episódios evita dores nas costas e letargia.</li>
        <li><strong>Snacks Planejados:</strong> Pipoca, água (muita água) e algo doce. Deixe tudo perto para não precisar pausar nos momentos de tensão.</li>
      </ul>

      <p>
        Gostou das indicações? Se você estiver em dúvida de onde achar essas e milhares de outras produções, acesse o guia completo de <Link to="/series" className="font-bold text-primary">Séries do Deazons</Link> para ver elencos, trailers, nota média da comunidade e sinopses detalhadas.
      </p>

      <div className="bg-muted p-8 rounded-xl mt-12 border border-border">
        <h2 id="faq" className="mt-0 mb-6">7. Perguntas Frequentes (FAQ)</h2>
        
        <h3 className="text-lg font-bold mb-2">Quantos episódios são recomendados maratonar por dia?</h3>
        <p className="mb-4 text-muted-foreground">Especialistas em saúde indicam que não mais do que 3 a 4 horas seguidas de televisão para evitar cansaço visual e sedentarismo agudo. Em episódios de comédia (20 min), seriam até 10 episódios. Para dramas (60 min), no máximo 4 por dia.</p>
        
        <h3 className="text-lg font-bold mb-2">O que fazer se sentir sono no meio da série?</h3>
        <p className="mb-4 text-muted-foreground">Pare imediatamente. Maratonar com sono estraga a experiência narrativa, já que você perderá detalhes sutis da história ou dormirá e o serviço de streaming continuará tocando os episódios automaticamente, estragando o enredo com spoilers ao acordar.</p>
        
        <h3 className="text-lg font-bold mb-2">Qual a melhor série curta (minissérie) para um único dia?</h3>
        <p className="mb-4 text-muted-foreground">"Chernobyl" (Max) e "O Gambito da Rainha" (Netflix) são excelentes opções. Ambas têm um número limitado de episódios, histórias fechadas fantásticas e podem ser devoradas em uma tarde de domingo (cerca de 5 a 6 horas totais de duração).</p>
        
        <h3 className="text-lg font-bold mb-2">O binge-watching afeta a saúde mental?</h3>
        <p className="mb-4 text-muted-foreground">Pode afetar. O consumo desenfreado às vezes é um sintoma de fuga da realidade ou procrastinação severa. No entanto, se feito de forma esporádica e como forma de entretenimento intencional, é perfeitamente normal e saudável.</p>
        
        <h3 className="text-lg font-bold mb-2">Por que as plataformas agora lançam séries semanalmente?</h3>
        <p className="mb-4 text-muted-foreground">Serviços como HBO Max (Max) e Disney+ voltaram ao modelo semanal para manter o engajamento e a conversa nas redes sociais (o "boca a boca") durando por meses, em vez de o assunto morrer em um único fim de semana, como muitas vezes acontece nos lançamentos da Netflix.</p>
      </div>
    </>
  );
}
