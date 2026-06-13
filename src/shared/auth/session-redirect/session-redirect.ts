import { SESSION_EXPIRED_MESSAGE } from "../constants";

let isRedirecting = false;

/**
 * Indica se o erro representa uma sessão expirada.
 *
 * Aceita tanto um `Error` (caminho de query, que lança) quanto uma `string`
 * (caminho de mutation, que retorna `ActionResult.error`). A detecção por string
 * é confiável em produção porque vem de um valor de retorno — diferente de erros
 * lançados por Server Actions, cuja mensagem o Next.js sanitiza no build de prod.
 */
export function isSessionExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : error;
  return message === SESSION_EXPIRED_MESSAGE;
}

/**
 * Redireciona para `/login` sinalizando sessão expirada.
 *
 * Usa hard navigation (`window.location`) de propósito: reseta todo o estado
 * client-side (cache do React Query, contexto) e garante que o proxy reavalie a
 * sessão. Idempotente — dispara no máximo uma vez por ciclo de vida da página.
 */
export function redirectToSessionExpired(): void {
  if (isRedirecting || typeof window === "undefined") return;

  isRedirecting = true;
  const returnUrl = window.location.pathname + window.location.search;
  const params = new URLSearchParams({ sessionExpired: "true", returnUrl });
  window.location.href = `/login?${params.toString()}`;
}

/** @internal Exported for testing only */
export function resetSessionRedirect(): void {
  isRedirecting = false;
}
