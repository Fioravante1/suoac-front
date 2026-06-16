import { useMemo } from "react";

import { useToastContext, type ToastOptions } from "./toast-provider";

interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
}

export function useToast(): ToastApi {
  const { showToast, dismissToast } = useToastContext();

  return useMemo(
    () => ({
      success: (message, options) => showToast("success", message, options),
      error: (message, options) => showToast("error", message, options),
      info: (message, options) => showToast("info", message, options),
      warning: (message, options) => showToast("warning", message, options),
      dismiss: dismissToast,
    }),
    [showToast, dismissToast],
  );
}
