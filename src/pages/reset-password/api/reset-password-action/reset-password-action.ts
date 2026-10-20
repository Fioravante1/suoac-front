"use server";

import { redirect } from "next/navigation";

import { endpoints, httpClient, HttpError } from "@/shared/api/http-client";
import { deleteSession } from "@/shared/auth/session";
import { routes } from "@/shared/config";

import { resetPasswordSchema } from "../../model";
import type { TokenState } from "../../model";

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * O sucesso nao aparece aqui: ele termina em `redirect`, e a funcao nao retorna.
 */
export type ResetPasswordResult =
  /** Token recusado no submit: a tela troca o formulario pelo aviso do estado. */
  | { status: "token-rejected"; tokenState: Exclude<TokenState, "valid"> }
  /** Falha recuperavel: a pessoa corrige e tenta de novo no mesmo formulario. */
  | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível redefinir a senha agora. Verifique sua conexão e tente novamente.";
const INVALID_INPUT = "Revise a senha e a confirmação.";
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";

/** Mesma rota, sem token: a confirmacao nao precisa dele e nao deve carrega-lo. */
const RESET_PASSWORD_SUCCESS_URL = `${routes.resetPassword}?status=sucesso`;

/**
 * Redefine a senha com o token do link.
 *
 * Contrato: `POST /auth/password-resets`, corpo `{ token, newPassword }` —
 * `204` em caso de sucesso, e os mesmos `400` / `410` / `409` do endpoint de
 * verificacao para os estados de token.
 *
 * O token vai **no corpo**, nunca na query string: query string entra em log de
 * acesso, no historico do navegador e no cabecalho `Referer`.
 *
 * A API nao devolve sessao — a redefinicao tambem encerra as sessoes ativas do
 * usuario, inclusive em outro dispositivo —, entao nao ha o que guardar aqui e a
 * tela de sucesso leva ao login.
 *
 * O cookie local precisa ser apagado junto. Ele nao e mais valido do lado do
 * servidor, e deixa-lo no navegador tem consequencia concreta: o `routeGuard`
 * manda quem tem cookie para o painel ao visitar `/login`, e o botao da tela de
 * sucesso vai justamente para `/login`. Num computador compartilhado — o caso
 * que motivou liberar esta rota no guard — isso jogaria quem acabou de
 * redefinir dentro da conta de outra pessoa, que continua com sessao valida.
 *
 * E termina em `redirect`, nao devolvendo `success` para a tela guardar em
 * estado. O motivo e mecanico: escrever cookie numa Server Action marca a
 * requisicao como revalidada, e o Next re-renderiza a rota junto com a resposta
 * da action. Essa re-renderizacao chamaria a verificacao de token outra vez —
 * agora com o token ja consumido, que responde `409` — e trocaria a tela de
 * sucesso por "link ja usado" na cara de quem acabou de redefinir. O `redirect`
 * corta esse caminho, e de quebra tira o token da URL e do historico.
 */
export async function resetPasswordAction(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse({
    newPassword: input.newPassword,
    confirmPassword: input.confirmPassword,
  });

  if (!parsed.success) {
    return { status: "error", message: INVALID_INPUT };
  }

  if (!input.token) {
    return { status: "token-rejected", tokenState: "invalid" };
  }

  try {
    await httpClient<void>(endpoints.auth.passwordResets, {
      method: "POST",
      body: { token: input.token, newPassword: parsed.data.newPassword },
    });
  } catch (error) {
    if (!(error instanceof HttpError)) {
      return { status: "error", message: GENERIC_ERROR };
    }

    if (error.status === 410) return { status: "token-rejected", tokenState: "expired" };
    if (error.status === 409) return { status: "token-rejected", tokenState: "used" };

    /*
     * O `400` e ambiguo no contrato: cobre token invalido e senha reprovada pela
     * politica do servidor. A politica e validada aqui antes do envio, com as
     * mesmas regras do backend, entao senha recusada neste ponto seria
     * divergencia entre os dois lados — e o caso realista e token invalido.
     */
    if (error.status === 400) return { status: "token-rejected", tokenState: "invalid" };

    /*
     * Defensivo: hoje o backend limita por tentativa apenas o endpoint de
     * solicitacao do link, nao este. Se um limite aparecer aqui — no servico ou
     * numa camada na frente dele —, a mensagem certa e esta, e nao a generica.
     */
    if (error.status === 429) return { status: "error", message: RATE_LIMIT_ERROR };

    return { status: "error", message: GENERIC_ERROR };
  }

  /*
   * Fora do `try`: `redirect` sinaliza por excecao, e o `catch` acima a
   * engoliria, transformando sucesso em erro generico.
   */
  await deleteSession();

  redirect(RESET_PASSWORD_SUCCESS_URL);
}
