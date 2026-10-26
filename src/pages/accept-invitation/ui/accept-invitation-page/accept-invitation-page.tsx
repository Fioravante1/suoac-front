import { redirect } from "next/navigation";

/*
 * Do modulo, nao do barril `@/shared/lib`: este componente e renderizado no
 * servidor, e o barril reexporta hooks `"use client"` — o build falha ao ver
 * hook de cliente alcancado por Server Component.
 */
import { getSession } from "@/shared/auth/session";
import { routes } from "@/shared/config";
import { AuthShell } from "@/widgets/auth-shell";

import { loadInvitation } from "../../api/load-invitation-action";
import { readWelcomeSummary } from "../../api/welcome-cookie";
import { AcceptInvitationStage } from "../accept-invitation-stage";
import { InvitationNotice } from "../invitation-notice";
import { InvitationTicket } from "../invitation-ticket";
import { InvitationWelcome } from "../invitation-welcome";

interface AcceptInvitationPageProps {
  /** Valor cru de `?token=` — pode vir ausente, vazio ou repetido na URL. */
  token?: string | string[];
  /** `bem-vindo` apos o aceite, posto pelo `redirect` da action. */
  status?: string | string[];
}

/**
 * Tela de aceite do convite de congregacao, aberta pelo link do e-mail (SUC-27).
 *
 * Nasce sem fachada e sem flag, como a redefinicao de senha: nao existe versao
 * legada com que coexistir, e o link chega por e-mail — gatear a rota faria um
 * convite valido morrer se a flag fosse desligada depois do envio.
 *
 * O convite e consultado **aqui, no servidor**, antes de qualquer campo
 * aparecer: quem chega com link expirado le isso de imediato, em vez de
 * descobrir depois de digitar a senha. A consulta nao consome o convite.
 */
export async function AcceptInvitationPage({ token, status }: AcceptInvitationPageProps) {
  /*
   * As boas-vindas vem antes de qualquer consulta: depois do aceite nao ha
   * convite para consultar — o token foi consumido e a URL nao o carrega mais.
   */
  if (status === "bem-vindo") {
    const session = await getSession();
    const summary = await readWelcomeSummary();

    /*
     * O resumo so vale para a sessao que o criou. Ele fica no cookie por alguns
     * minutos, e num computador compartilhado quem abrisse esta URL depois que
     * o convidado saiu leria nome, e-mail e congregacao dele. A checagem tambem
     * poe a rota fora do alcance do bypass do guard: sem sessao da propria
     * pessoa, nao ha o que mostrar.
     */
    if (summary && session && session.email.toLowerCase() === summary.email.toLowerCase()) {
      return (
        <AuthShell aside={<InvitationTicket invitation={summary} badge="accepted" footnote="Convite aceito hoje" />}>
          <InvitationWelcome summary={summary} />
        </AuthShell>
      );
    }

    // Link de boas-vindas aberto depois dos minutos que o resumo vive, ou fora do
    // fluxo: quem tem sessao so tem o painel para ver, e quem nao tem — a conta
    // acabou de ser criada, ou nunca foi — entra pela tela de entrada, em vez de
    // ler "convite invalido".
    redirect(session ? routes.dashboard : routes.login);
  }

  // Query string repetida (`?token=a&token=b`) chega como array: nenhum dos dois
  // vale, porque nao da para saber qual a pessoa pretendia usar.
  // Em minusculas: o back gera o token em hexadecimal minusculo, e o link pode ter
  // passado por cliente de e-mail ou de mensagem que mexe na caixa do texto.
  const rawToken = (typeof token === "string" ? token : "").toLowerCase();
  const lookup = await loadInvitation(rawToken);

  if (lookup.status === "rejected") {
    return (
      <AuthShell>
        <InvitationNotice rejection={lookup.rejection} token={rawToken} />
      </AuthShell>
    );
  }

  return <AcceptInvitationStage token={rawToken} invitation={lookup.invitation} />;
}
