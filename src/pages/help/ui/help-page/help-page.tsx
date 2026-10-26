/**
 * Pagina publica de ajuda.
 *
 * Texto definitivo (SUC-45). Responde ao que alguem barrado na tela de entrada
 * precisa saber: como se consegue acesso e o que fazer quando nao se consegue
 * entrar. Nao documenta funcionalidade que ainda nao existe.
 *
 * O estilo do texto corrido vem da moldura em `app/(public)/layout.module.css`.
 */
export function HelpPage() {
  return (
    <article>
      <h1>Ajuda</h1>
      <p>Como conseguir acesso ao SUOAC e o que fazer quando a entrada não funciona.</p>

      <h2>O que é o SUOAC</h2>
      <p>
        É o sistema que organiza o transporte do circuito até assembleias e congressos: inscrição de passageiros,
        acompanhamento de pagamentos, montagem dos ônibus e listas de embarque.
      </p>

      <h2>Como se consegue acesso</h2>
      <p>
        Não há cadastro aberto. O acesso é dado por quem coordena: o Coordenador do arranjo de ônibus no circuito
        convida os Coordenadores do arranjo de ônibus nas congregações, que recebem um link por e-mail ou WhatsApp. Se
        você deveria ter acesso e não recebeu o convite, procure o Coordenador do arranjo de ônibus no seu circuito.
      </p>

      <h2>Não consigo entrar</h2>
      <ul>
        <li>
          Confira se o e-mail é o mesmo que recebeu o convite. É comum haver mais de um endereço em uso na congregação.
        </li>
        <li>
          Se a mensagem disser que a sessão expirou, basta entrar de novo — o sistema encerra a sessão depois de um
          tempo sem uso, por segurança.
        </li>
        <li>
          Se esqueceu a senha, use o link <strong>Esqueci a senha</strong> na tela de entrada: o sistema envia por
          e-mail um link para você criar uma nova. Se o link não funcionar ou o e-mail não chegar, peça ao Coordenador
          do arranjo de ônibus no seu circuito para reenviar o acesso.
        </li>
      </ul>

      <h2>Ainda precisa de ajuda</h2>
      <p>
        Fale com o Coordenador do arranjo de ônibus no seu circuito, que administra o sistema, cria os eventos e resolve
        questões de acesso. Se não conseguir falar com ele, escreva para{" "}
        <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
      </p>
    </article>
  );
}
