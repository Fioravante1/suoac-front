import { AuthShell, InnerAuthScreen } from "@/widgets/auth-shell";

import { verifyResetTokenAction } from "../../api/verify-reset-token-action";
import { ResetPasswordForm } from "../reset-password-form";
import { ResetPasswordSuccess } from "../reset-password-success";
import { TokenNotice } from "../token-notice";

interface ResetPasswordPageProps {
  /** Valor cru de `?token=` — pode vir ausente, vazio ou repetido na URL. */
  token?: string | string[];
  /** `sucesso` apos a redefinicao, posto pelo `redirect` da action. */
  status?: string | string[];
}

/**
 * Tela de redefinicao de senha, aberta pelo link do e-mail (SUC-26).
 *
 * Nasceu sem fachada e sem flag: nao havia versao legada com que coexistir, e o
 * link chega por e-mail — gatear a rota faria um link valido morrer se a flag
 * fosse desligada depois do envio (SUC-26).
 *
 * O token e verificado **aqui, no servidor**, antes de qualquer campo aparecer:
 * quem chega com link expirado le isso de imediato, em vez de descobrir depois
 * de digitar a senha nova duas vezes. A verificacao nao consome o token.
 */
export async function ResetPasswordPage({ token, status }: ResetPasswordPageProps) {
  /*
   * A confirmacao vem antes de qualquer verificacao: depois de redefinir nao ha
   * token para conferir — ele foi consumido e a URL nao o carrega mais.
   */
  if (status === "sucesso") {
    return (
      <AuthShell>
        <InnerAuthScreen>
          <ResetPasswordSuccess />
        </InnerAuthScreen>
      </AuthShell>
    );
  }

  // Query string repetida (`?token=a&token=b`) chega como array: nenhum dos dois
  // vale, porque nao da para saber qual a pessoa pretendia usar.
  const rawToken = typeof token === "string" ? token : "";
  const tokenState = await verifyResetTokenAction(rawToken);

  return (
    <AuthShell>
      <InnerAuthScreen>
        {tokenState === "valid" && <ResetPasswordForm token={rawToken} />}
        {tokenState !== "valid" && <TokenNotice state={tokenState} />}
      </InnerAuthScreen>
    </AuthShell>
  );
}
