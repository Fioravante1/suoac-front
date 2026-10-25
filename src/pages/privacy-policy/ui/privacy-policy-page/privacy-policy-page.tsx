/**
 * Pagina publica de privacidade.
 *
 * Texto definitivo (SUC-45). Os fatos sobre dados, visibilidade e cookies foram
 * verificados no codigo; retencao, compartilhamento, correcao/remocao e canal de
 * contato sao decisoes da coordenacao do circuito.
 *
 * O estilo do texto corrido vem da moldura em `app/(public)/layout.module.css`,
 * por isso aqui ha apenas conteudo semantico.
 */
export function PrivacyPolicyPage() {
  return (
    <article>
      <h1>Privacidade</h1>
      <p>Que informações o SUOAC guarda, para que servem e quem consegue vê-las.</p>

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

      <h2>Por quanto tempo os dados ficam</h2>
      <p>
        Os dados de um evento são mantidos por 2 anos. Já o cadastro dos irmãos permanece na base para ser usado em
        eventos futuros.
      </p>

      <h2>Compartilhamento</h2>
      <p>Os dados não são compartilhados fora do circuito.</p>

      <h2>Correção e remoção dos dados</h2>
      <p>
        O sistema é usado apenas por Coordenadores do arranjo de ônibus no circuito e nas congregações e por
        assistentes, e cada um pode corrigir os próprios dados. O Coordenador do arranjo de ônibus no circuito também
        pode excluir outros usuários.
      </p>
      <p>
        Quem viaja não usa o sistema, mas seus dados também podem ser corrigidos ou apagados: o pedido vai ao
        Coordenador do arranjo de ônibus na congregação ou ao e-mail{" "}
        <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
      </p>
      <p>
        Para excluir o cadastro do Coordenador do arranjo de ônibus no circuito, envie o pedido por e-mail para{" "}
        <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
      </p>

      <h2>Dúvidas e contato</h2>
      <p>
        O canal de contato do SUOAC é o e-mail <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
      </p>
    </article>
  );
}
