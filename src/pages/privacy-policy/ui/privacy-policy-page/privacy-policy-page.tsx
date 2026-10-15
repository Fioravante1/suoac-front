/**
 * Pagina publica de privacidade.
 *
 * O texto e **provisorio** e diz isso na propria pagina. Descreve apenas o que
 * foi verificado no codigo — os dados que o sistema trata, quem os ve e quais
 * cookies existem — e nao assume compromisso que ninguem decidiu ainda. As
 * perguntas que faltam estao listadas para quem for redigir a versao final.
 *
 * O estilo do texto corrido vem da moldura em `app/(public)/layout.module.css`,
 * por isso aqui ha apenas conteudo semantico.
 */
export function PrivacyPolicyPage() {
  return (
    <article>
      <h1>Privacidade</h1>
      <p>Que informações o SUOAC guarda, para que servem e quem consegue vê-las.</p>

      <aside>
        <p>
          <strong>Este texto é provisório.</strong> A política definitiva ainda será redigida pela coordenação do
          circuito. O que está abaixo descreve o funcionamento atual do sistema, sem assumir compromissos que ainda não
          foram decididos.
        </p>
      </aside>

      <h2>Que dados o sistema guarda</h2>
      <p>
        O SUOAC existe para organizar o transporte até assembleias e congressos. Os dados que ele guarda são os
        necessários para isso:
      </p>
      <ul>
        <li>de quem viaja: nome, congregação, dias de participação e os pagamentos registrados;</li>
        <li>de quem coordena: nome, e-mail e o papel exercido no circuito ou na congregação.</li>
      </ul>

      <h2>Quem consegue ver</h2>
      <p>
        O acesso acompanha a responsabilidade de cada um. Quem coordena uma congregação vê os dados da própria
        congregação. Quem coordena o circuito vê o circuito inteiro, porque precisa montar os ônibus e fechar as contas
        do evento.
      </p>

      <h2>Cookies</h2>
      <p>O sistema usa dois cookies, ambos necessários para ele funcionar:</p>
      <ul>
        <li>um que mantém você conectado, assinado para não poder ser adulterado no navegador;</li>
        <li>outro que lembra se você prefere o tema claro ou escuro.</li>
      </ul>
      <p>Não há cookies de publicidade nem ferramentas de rastreamento de navegação.</p>

      <h2>O que a versão final precisa responder</h2>
      <p>
        Estas perguntas dependem de decisão da coordenação e por isso ainda não estão respondidas aqui: por quanto tempo
        os dados de um evento são mantidos depois que ele termina; em que situações eles são compartilhados fora do
        circuito; e como alguém pede correção ou remoção dos próprios dados.
      </p>

      <h2>Dúvidas</h2>
      <p>
        Enquanto não há um canal próprio, fale com o coordenador do seu circuito — é quem administra o sistema e pode
        encaminhar o assunto.
      </p>
    </article>
  );
}
