"use client";

import { useCallback, useState } from "react";

import { redirectOnAuthError } from "@/shared/auth/session-redirect";

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
    // Sessão expirada e troca de senha obrigatória (vindas de ActionResult.error) não são erro
    // de formulário: levam ao login ou à definição de senha, em vez de mostrar a mensagem inline.
    if (redirectOnAuthError(error)) return;

    const normalizedError = error?.trim();

    setServerError(normalizedError && normalizedError.length > 0 ? normalizedError : fallbackMessage);
  }, []);

  return { serverError, clearServerError, showServerError };
}
