import { useCallback, useState } from "react";

import {
  isSessionExpiredError,
  redirectToSessionExpired,
  isPasswordChangeRequiredError,
  redirectToPasswordChangeRequired,
} from "@/shared/auth/session-redirect";

const DEFAULT_SERVER_ERROR_MESSAGE = "Ocorreu um erro inesperado.";

interface UseServerErrorReturn {
  serverError: string | null;
  clearServerError: () => void;
  showServerError: (error?: string | null, fallbackMessage?: string) => void;
}

export function useServerError(): UseServerErrorReturn {
  const [serverError, setServerError] = useState<string | null>(null);

  const clearServerError = useCallback(() => {
    setServerError(null);
  }, []);

  const showServerError = useCallback((error?: string | null, fallbackMessage = DEFAULT_SERVER_ERROR_MESSAGE) => {
    // Sessão expirada (vinda de ActionResult.error) não é um erro de formulário:
    // redireciona para /login em vez de exibir a mensagem inline.
    if (isSessionExpiredError(error)) {
      redirectToSessionExpired();
      return;
    }

    // Troca de senha obrigatória: redireciona para a tela de definição de senha.
    if (isPasswordChangeRequiredError(error)) {
      redirectToPasswordChangeRequired();
      return;
    }

    const normalizedError = error?.trim();

    setServerError(normalizedError && normalizedError.length > 0 ? normalizedError : fallbackMessage);
  }, []);

  return { serverError, clearServerError, showServerError };
}
