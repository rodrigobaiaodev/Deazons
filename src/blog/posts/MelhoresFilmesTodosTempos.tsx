import { Link } from "react-router-dom";

export default function MelhoresFilmesTodosTempos({ images }: { images: any[] }) {
  const image2 = images[1]?.url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2669&auto=format&fit=crop";
  const image3 = images[2]?.url || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2650&auto=format&fit=crop";

  return (
    <>
      <div className="bg-muted p-6 rounded-xl mb-10 border border-border">
        <h2 className="text-xl font-bold mb-4 mt-0 border-b border-border/50 pb-2">Índice</h2>
        <ul className="space-y-2 mb-0 list-none pl-0">
          <li><a href="#introducao" className="no-underline hover:underline">1. Introdução: O Que Torna um Filme "O Melhor"?</a></li>
          <li><a href="#classicos" className="no-underline hover:underline">2. Os Clássicos Intocáveis (1970 - 1999)</a></li>
          <li><a href="#modernos" className="no-underline hover:underline">3. As Obras-Primas Modernas (2000 - Atualidade)</a></li>
          <li><a href="#sci-fi" className="no-underline hover:underline">4. Épicos e Ficção Científica</a></li>
          <li><a href="#internacional" className="no-underline hover:underline">5. Cinema Internacional e de Autor</a></li>
          <li><a href="#faq" className="no-underline hover:underline">6. Perguntas Frequentes (FAQ)</a></li>
        </ul>
      </div>

      <h2 id="introducao">1. Introdução: O Que Torna um Filme "O Melhor"?</h2>
      <p>
        Fazer uma lista dos melhores filmes de todos os tempos é sempre um exercício polêmico. A arte é subjetiva: o que faz uma pessoa chorar copiosamente, faz outra dormir de tédio. No entanto, quando cruzamos listas do <em>American Film Institute (AFI)</em>, notas do <em>IMDb</em>, críticas no <em>Rotten Tomatoes</em> e opiniões do júri de Cannes, alguns nomes sempre se repetem.
      </p>
      <p>
        Um verdadeiro "clássico" é aquele filme que transcende a época do seu lançamento. Suas técnicas de câmera inovam a indústria, seus diálogos moldam a cultura pop e seus temas continuam relevantes décadas depois. Abaixo, separamos os filmes essenciais que formam a base da cinefilia mundial.
      </p>

      <h2 id="classicos">2. Os Clássicos Intocáveis (1970 - 1999)</h2>
      <p>
        As décadas de 70 a 90 são frequentemente chamadas de a "Idade de Prata" de Hollywood e geraram obras absolutas do cinema americano.
      </p>
      
      <h3>O Poderoso Chefão (The Godfather, 1972)</h3>
      <p>
        Dirigido por Francis Ford Coppola, este não é apenas um filme sobre a Máfia. É um estudo profundo sobre poder, capitalismo, corrupção familiar e o famigerado "Sonho Americano". As atuações de Marlon Brando (Vito Corleone) e Al Pacino (Michael) ditaram a forma como a atuação dramática seria ensinada pelas próximas décadas. <strong>Status:</strong> Frequentemente eleito o #1 de todas as listas.
      </p>

      <h3>Um Sonho de Liberdade (The Shawshank Redemption, 1994)</h3>
      <p>
        Baseado num conto de Stephen King, a história de Andy Dufresne (Tim Robbins) e Red (Morgan Freeman) na prisão de Shawshank é o número 1 no ranking popular do IMDb há anos. A mensagem subjacente sobre esperança e perseverança ressoa perfeitamente com qualquer espectador, não importa o país de origem.
      </p>

      <h3>A Lista de Schindler (Schindler's List, 1993)</h3>
      <p>
        A obra mais madura e devastadora de Steven Spielberg. Gravado quase inteiramente em preto e branco, narra a verdadeira história do industrialista nazista Oskar Schindler, que gastou toda sua fortuna para salvar judeus do Holocausto. É o tipo de filme essencial para não deixarmos os horrores da humanidade serem esquecidos.
      </p>

      <figure className="my-10">
        <img src={image2} alt="Sala de cinema antiga" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">Clássicos do cinema continuam sendo objeto de estudo nas maiores universidades do mundo.</figcaption>
      </figure>

      <h2 id="modernos">3. As Obras-Primas Modernas (2000 - Atualidade)</h2>
      <p>
        Com a virada do milênio e o boom dos efeitos especiais e roteiros não-lineares, novos gênios da direção se consolidaram.
      </p>

      <h3>Cidade de Deus (2002)</h3>
      <p>
        Temos que citar o orgulho nacional. A frenética direção de Fernando Meirelles colocou o cinema brasileiro no mapa global com sua montagem estilo "videoclipe", atuações viscerais (na sua maioria não-atores das comunidades) e uma história de crime que chocou o mundo. É citado até hoje por gigantes como Tarantino e Scorsese.
      </p>

      <h3>Batman: O Cavaleiro das Trevas (The Dark Knight, 2008)</h3>
      <p>
        Christopher Nolan provou que filmes de super-heróis podem (e devem) ser levados a sério. O roteiro se aproxima mais de um suspense de máfia e terrorismo urbano do que de um gibi de ação, alavancado pela performance magistral (e póstuma) de Heath Ledger como o Coringa, que lhe rendeu o Oscar de Melhor Ator Coadjuvante.
      </p>
      
      <h3>Parasita (Parasite, 2019)</h3>
      <p>
        O filme do diretor sul-coreano Bong Joon-ho quebrou uma barreira histórica de 92 anos ao se tornar o primeiro filme em língua não inglesa a vencer o Oscar de Melhor Filme. Um thriller de humor ácido brilhante que escancara a luta de classes de uma forma universalmente compreensível.
      </p>

      <h2 id="sci-fi">4. Épicos e Ficção Científica</h2>
      <p>
        Os filmes que expandem as fronteiras tecnológicas e visuais do cinema, provando que não há limite para a imaginação humana.
      </p>

      <h3>2001: Uma Odisseia no Espaço (1968)</h3>
      <p>
        Stanley Kubrick antecipou as viagens espaciais e a inteligência artificial muito antes do pouso na Lua ou da internet. Visualmente deslumbrante e filosoficamente complexo, a cena da elipse de tempo (onde um osso atirado ao alto se transforma numa espaçonave) é talvez a mais famosa da história.
      </p>

      <h3>O Senhor dos Anéis: O Retorno do Rei (2003)</h3>
      <p>
        A conclusão da jornada de Frodo para destruir o Um Anel. O escopo épico, as batalhas massivas que redefiniram o CGI moderno e o peso emocional que culminou no recorde de vitórias em um único Oscar (11 estatuetas), igualando Ben-Hur e Titanic.
      </p>

      <figure className="my-10">
        <img src={image3} alt="Câmera de filmagem profissional" className="w-full rounded-xl" />
        <figcaption className="text-center text-sm text-muted-foreground mt-2">Épicos e ficção científica frequentemente empurram os limites da tecnologia audiovisual.</figcaption>
      </figure>

      <h2 id="internacional">5. Cinema Internacional e de Autor</h2>
      <p>
        Fora de Hollywood, a genialidade floresce muitas vezes com menos recursos e maior liberdade criativa.
      </p>

      <h3>Os Sete Samurais (Shichinin no Samurai, 1954)</h3>
      <p>
        A obra máxima do diretor japonês Akira Kurosawa. A história da vila de fazendeiros que contrata ronins (samurais sem mestre) para defendê-los de bandidos não apenas ditou como se faz um filme de ação perfeito, mas influenciou Star Wars, Mad Max e os Vingadores modernos.
      </p>

      <h3>A Viagem de Chihiro (Spirited Away, 2001)</h3>
      <p>
        A animação japonesa de Hayao Miyazaki, do Studio Ghibli, é um conto de fadas sombrio e encantador sobre uma garota presa no mundo dos espíritos. A animação 2D desenhada à mão tem uma qualidade etérea que nenhum modelo 3D moderno conseguiu replicar até hoje.
      </p>

      <p>
        Quer explorar mais títulos por conta própria e salvar na sua lista? Utilize nossa seção especial de <Link to="/pesquisa" className="font-bold text-primary">Pesquisa Avançada do Deazons</Link> e garimpe pelo seu diretor ou gênero favorito.
      </p>

      <div className="bg-muted p-8 rounded-xl mt-12 border border-border">
        <h2 id="faq" className="mt-0 mb-6">6. Perguntas Frequentes (FAQ)</h2>
        
        <h3 className="text-lg font-bold mb-2">Por que o ranking do IMDb muda tanto?</h3>
        <p className="mb-4 text-muted-foreground">O IMDb é um agregador de votos abertos ao público. Filmes recém-lançados (com muito hype) frequentemente saltam para o Top 10 temporariamente devido ao excesso de notas 10 dadas por fãs engajados (o "recency bias"), mas a nota costuma cair gradualmente com o tempo.</p>
        
        <h3 className="text-lg font-bold mb-2">Um filme precisa ser antigo para ser considerado um "clássico"?</h3>
        <p className="mb-4 text-muted-foreground">Não necessariamente. Embora a prova do tempo seja o teste mais confiável (um filme que as pessoas assistem 50 anos depois é sem dúvidas um clássico), filmes recentes como "Mad Max: Estrada da Fúria" (2015) já nasceram sendo rotulados como clássicos modernos por críticos influentes.</p>
        
        <h3 className="text-lg font-bold mb-2">Onde posso encontrar listas oficiais de melhores filmes?</h3>
        <p className="mb-4 text-muted-foreground">As fontes mais respeitadas no meio cinematográfico são: a lista dos 100 Anos... 100 Filmes do AFI (American Film Institute) e, mais importante para o mercado internacional, a famosa pesquisa "Sight & Sound" do British Film Institute, realizada a cada dez anos com centenas de críticos notáveis.</p>
        
        <h3 className="text-lg font-bold mb-2">Qual a diferença entre a nota da Crítica e a do Público?</h3>
        <p className="mb-4 text-muted-foreground">Sites como o Rotten Tomatoes separam as notas. A "Tomatometer" representa a aprovação da crítica especializada (jornalistas e estudiosos que avaliam técnica, enredo e ritmo de forma rígida), enquanto o "Audience Score" reflete se pessoas comuns gostaram ou se divertiram. Filmes pipoca tendem a agradar muito o público e menos a crítica, enquanto obras mais lentas ou experimentais têm o efeito reverso.</p>
        
        <h3 className="text-lg font-bold mb-2">Quantos filmes da lista do AFI estão em preto e branco?</h3>
        <p className="mb-4 text-muted-foreground">Muitos! Do top 100 do AFI de 2007, cerca de 30% são filmes em preto e branco, provando que a cinematografia monocromática (especialmente com luz e sombra - chiaroscuro) cria tensões e belezas visuais inatingíveis pelo cinema colorido, com obras obrigatórias como "Casablanca" e "Cidadão Kane".</p>
      </div>
    </>
  );
}
