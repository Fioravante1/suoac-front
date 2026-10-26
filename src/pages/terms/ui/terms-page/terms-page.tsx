import Link from "next/link";

import { routes } from "@/shared/config/routes";

/**
 * Pagina publica de termos de uso (SUC-63).
 *
 * Texto definitivo, aprovado pelo dono do produto. Nao ha clausula de limitacao
 * de responsabilidade nem de foro de proposito: dependem de revisao juridica.
 *
 * O estilo do texto corrido vem da moldura em `app/(public)/layout.module.css`,
 * por isso aqui ha apenas conteudo semantico.
 */
export function TermsPage() {
  return (
    <article>
      <h1>Termos de uso</h1>
      <p>Última atualização: 25 de outubro de 2026</p>

      <h2>1. O que é o SUOAC</h2>
      <p>
        O SUOAC é um sistema que organiza o transporte do circuito até assembleias e congressos: inscrição de
        passageiros, acompanhamento de pagamentos, montagem dos ônibus e listas de embarque. Ele não tem fins comerciais
        e é mantido por Fioravante Chiozzi, que responde pelo sistema.
      </p>

      <h2>2. Quem pode usar</h2>
      <p>O acesso é restrito a quem exerce uma função na organização do transporte:</p>
      <ul>
        <li>Coordenadores do arranjo de ônibus no circuito;</li>
        <li>Coordenadores do arranjo de ônibus nas congregações;</li>
        <li>assistentes.</li>
      </ul>
      <p>
        Não há cadastro aberto. O acesso é dado por convite do Coordenador do arranjo de ônibus no circuito, ou pelo
        cadastro do próprio Coordenador do circuito, confirmado por um código enviado ao e-mail informado. Ao aceitar
        estes termos, você declara que exerce a função para a qual recebeu acesso.
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>
          A conta é pessoal e intransferível. Não compartilhe sua senha, nem para &ldquo;ajudar&rdquo; outra pessoa a
          entrar.
        </li>
        <li>
          Você é responsável pelo que for feito com a sua conta. Se suspeitar que a senha foi descoberta, troque-a
          imediatamente e avise o Coordenador do arranjo de ônibus no seu circuito ou escreva para{" "}
          <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
        </li>
        <li>
          Use um computador de confiança. A opção &ldquo;manter conectado&rdquo; só deve ser marcada em um computador
          que seja seu.
        </li>
      </ul>

      <h2>4. Como usar o sistema</h2>
      <p>Você se compromete a:</p>
      <ul>
        <li>cadastrar apenas dados verdadeiros e necessários para o transporte;</li>
        <li>consultar apenas os dados da sua congregação ou do seu circuito, conforme a sua função;</li>
        <li>tratar os dados dos irmãos com cuidado e não os copiar, divulgar ou usar para outra finalidade;</li>
        <li>não tentar acessar áreas ou dados que o sistema não liberou para você.</li>
      </ul>
      <p>
        É proibido testar a segurança do sistema, tentar burlar as permissões ou usá-lo de forma que prejudique outras
        pessoas.
      </p>

      <h2>5. Dados pessoais</h2>
      <p>
        O SUOAC guarda dados de quem viaja (nome, RG, telefone e observações, quando informados, além de congregação,
        dias de participação e pagamentos) e de quem coordena. Quem vê o quê, por quanto tempo os dados ficam e como
        pedir correção ou remoção estão descritos na página de <Link href={routes.privacy}>Privacidade</Link>, que faz
        parte destes termos.
      </p>

      <h2>6. Pagamentos</h2>
      <p>
        O sistema apenas registra e acompanha os pagamentos feitos fora dele. Ele não recebe nem movimenta dinheiro.
        Quem registra um pagamento responde pela exatidão do valor lançado.
      </p>

      <h2>7. Disponibilidade</h2>
      <p>
        Fazemos o possível para manter o sistema no ar, mas ele pode ficar indisponível para manutenção ou por falhas
        fora do nosso controle. Não há prazo garantido para restabelecê-lo, mas o trabalho para deixá-lo disponível o
        quanto antes é contínuo. Recomendamos que as listas de embarque do dia do evento sejam exportadas com
        antecedência.
      </p>

      <h2>8. Suspensão e encerramento do acesso</h2>
      <p>O acesso pode ser suspenso ou encerrado, a qualquer momento, quando:</p>
      <ul>
        <li>a pessoa deixar a função para a qual recebeu acesso;</li>
        <li>houver uso em desacordo com estes termos;</li>
        <li>a conta for usada por outra pessoa.</li>
      </ul>
      <p>
        O Coordenador do arranjo de ônibus no circuito pode excluir outros usuários. Para excluir o cadastro do próprio
        Coordenador do circuito, o pedido é feito por e-mail para <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
      </p>

      <h2>9. Mudanças nestes termos</h2>
      <p>
        Os termos podem ser atualizados. Quando a mudança for relevante, o uso continuado do sistema depois da
        atualização vale como aceite da nova versão. A data da última atualização fica no topo da página.
      </p>

      <h2>10. Contato</h2>
      <p>
        Dúvidas sobre estes termos ou sobre o sistema: <a href="mailto:suoac@gmail.com">suoac@gmail.com</a>.
      </p>
    </article>
  );
}
