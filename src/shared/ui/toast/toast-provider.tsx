"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { Toaster } from "./toaster";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastRecord {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Limita toasts simultâneos para não sobrecarregar o usuário (mantém os mais recentes).
const MAX_TOASTS = 3;

// Sucesso/info são curtos; erros ficam mais tempo por exigirem leitura/ação.
const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, message: string, durationMs?: number) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;

      setToasts((current) => [...current, { id, variant, message }].slice(-MAX_TOASTS));

      const timer = setTimeout(() => dismissToast(id), durationMs ?? DEFAULT_DURATION_MS[variant]);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// Fallback no-op: a UI de toast é não-crítica, então consumir `useToast` sem o
// provider (ex.: componentes isolados em testes) não deve quebrar a renderização.
const NOOP_TOAST_CONTEXT: ToastContextValue = {
  showToast: () => {},
  dismissToast: () => {},
};

export function useToastContext(): ToastContextValue {
  return useContext(ToastContext) ?? NOOP_TOAST_CONTEXT;
}
