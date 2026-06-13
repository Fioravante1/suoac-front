"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../auth-context";
import { redirectToSessionExpired, subscribeToSessionRedirect } from "../session-redirect";
import { SessionExpiredOverlay } from "./session-expired-overlay";

/**
 * Guarda de sessão para rotas privadas.
 *
 * Redireciona para `/login` sempre que a sessão deixa de existir enquanto o
 * usuário está numa rota privada — caso típico: a sessão expira durante o uso, o
 * `http-client` apaga os cookies ao falhar o refresh e o re-render volta com
 * `user = null`, mas sem uma navegação que acione o proxy.
 *
 * Reage ao **estado** da sessão (`user === null`), não à mensagem de erro, então
 * é imune à sanitização de erros de Server Action em produção. Cobre Server
 * Actions chamadas via `form action` direto e qualquer re-render que zere a
 * sessão. Complementa o `useServerError` (mutations) e o `query-client`
 * (queries).
 *
 * Enquanto a hard navigation para o login carrega, exibe o
 * `SessionExpiredOverlay` — disparado por qualquer caminho de redirect via
 * `subscribeToSessionRedirect`, para o usuário nunca ver a tela privada oca.
 */
export function SessionGuard() {
  const { isAuthenticated } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => subscribeToSessionRedirect(() => setIsRedirecting(true)), []);

  useEffect(() => {
    if (!isAuthenticated) redirectToSessionExpired();
  }, [isAuthenticated]);

  return isRedirecting ? <SessionExpiredOverlay /> : null;
}
