import { useMemo } from "react";

import { useToastContext } from "./toast-provider";

interface ToastApi {
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

export function useToast(): ToastApi {
  const { showToast, dismissToast } = useToastContext();

  return useMemo(
    () => ({
      success: (message, durationMs) => showToast("success", message, durationMs),
      error: (message, durationMs) => showToast("error", message, durationMs),
      info: (message, durationMs) => showToast("info", message, durationMs),
      warning: (message, durationMs) => showToast("warning", message, durationMs),
      dismiss: dismissToast,
    }),
    [showToast, dismissToast],
  );
}
