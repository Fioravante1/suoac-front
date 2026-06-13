"use client";

import { useEffect } from "react";

import { useAuth } from "../auth-context";
import { redirectToSessionExpired } from "../session-redirect";

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
 */
export function SessionGuard(): null {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) redirectToSessionExpired();
  }, [isAuthenticated]);

  return null;
}
