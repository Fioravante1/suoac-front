/**
 * Pagina publica de ajuda.
 *
 * Texto **provisorio**, como a de privacidade. Responde ao que alguem barrado na
 * tela de entrada precisa saber: como se consegue acesso e o que fazer quando
 * nao se consegue entrar. Nao documenta funcionalidade que ainda nao existe.
 *
 * O estilo do texto corrido vem da moldura em `app/(public)/layout.module.css`.
 */
export function HelpPage() {
  return (
    <article>
      <h1>Ajuda</h1>
      <p>Como conseguir acesso ao SUOAC e o que fazer quando a entrada não funciona.</p>

      <aside>
        <p>
          <strong>Este texto é provisório.</strong> Ele cobre o que costuma travar na hora de entrar. O material de
          ajuda completo será escrito pela coordenação do circuito.
        </p>
      </aside>

      <h2>O que é o SUOAC</h2>
      <p>
        É o sistema que organiza o transporte do circuito até assembleias e congressos: inscrição de passageiros,
        acompanhamento de pagamentos, montagem dos ônibus e listas de embarque.
      </p>

      <h2>Como se consegue acesso</h2>
      <p>
        Não há cadastro aberto. O acesso é dado por quem coordena: o coordenador do circuito convida os coordenadores de
        congregação, que recebem um link por e-mail ou WhatsApp. Se você deveria ter acesso e não recebeu o convite,
        procure o coordenador do seu circuito.
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
          Se a senha não funcionar, peça ao coordenador do circuito para reenviar o acesso. A recuperação de senha pela
          própria tela ainda está sendo construída.
        </li>
      </ul>

      <h2>Ainda precisa de ajuda</h2>
      <p>
        Fale com o coordenador do seu circuito. É quem administra o sistema, cria os eventos e consegue resolver
        questões de acesso.
      </p>
    </article>
  );
}
