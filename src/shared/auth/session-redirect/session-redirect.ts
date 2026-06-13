/**
 * Por que este módulo existe (decisão de arquitetura — Next.js 16):
 *
 * O cenário "sessão expira no meio do uso, sem navegação" não tem primitivo
 * estável no Next 16. As alternativas idiomáticas foram avaliadas e descartadas
 * com base na documentação local (`node_modules/next/dist/docs/`):
 *
 * - `redirect()` dentro do `http-client`: a doc orienta chamar redirect fora de
 *   blocos `try` ("redirect should be called outside the try block"), e todas as
 *   mutations usam o padrão `ActionResult` com try/catch — o NEXT_REDIRECT seria
 *   engolido. O escape hatch (`unstable_rethrow`) é API instável.
 * - `unauthorized()` + `unauthorized.tsx`: é a API feita para este caso, mas é
 *   experimental no Next 16 (flag `experimental.authInterrupts`).
 *
 * Por isso a detecção é feita em sinais que sobrevivem à produção (valor
 * retornado em `ActionResult.error` e estado da sessão no `SessionGuard` — a
 * mensagem de erros lançados por Server Actions é sanitizada em prod), e o
 * redirect usa hard navigation para resetar o estado client-side (cache do
 * React Query) entre sessões.
 *
 * TODO(next): quando `authInterrupts` estabilizar, migrar para `unauthorized()`
 * no `http-client` + `unauthorized.tsx`, e remover este módulo, o
 * `SessionGuard` e a detecção no `useServerError`/`query-client`.
 */
import { SESSION_EXPIRED_MESSAGE } from "../constants";

let isRedirecting = false;

type SessionRedirectListener = () => void;

const listeners = new Set<SessionRedirectListener>();

/**
 * Registra um listener notificado no instante em que o redirect de sessão
 * expirada é disparado, em qualquer caminho (query, mutation ou SessionGuard).
 * Permite exibir feedback visual enquanto a hard navigation carrega o login.
 * Retorna a função de unsubscribe.
 */
export function subscribeToSessionRedirect(listener: SessionRedirectListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

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
  listeners.forEach((listener) => listener());

  const returnUrl = window.location.pathname + window.location.search;
  const params = new URLSearchParams({ sessionExpired: "true", returnUrl });
  window.location.href = `/login?${params.toString()}`;
}

/** @internal Exported for testing only */
export function resetSessionRedirect(): void {
  isRedirecting = false;
}
