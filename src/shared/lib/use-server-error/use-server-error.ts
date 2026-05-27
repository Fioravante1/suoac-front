import { useCallback, useState } from "react";

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
    const normalizedError = error?.trim();

    setServerError(normalizedError && normalizedError.length > 0 ? normalizedError : fallbackMessage);
  }, []);

  return { serverError, clearServerError, showServerError };
}
