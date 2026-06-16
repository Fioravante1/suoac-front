"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { Toaster } from "./toaster";

export type ToastVariant = "success" | "error" | "info" | "warning";

/** Ação de recuperação opcional exibida dentro do toast (ex.: "Tentar novamente"). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  durationMs?: number;
  action?: ToastAction;
}

export interface ToastRecord {
  id: string;
  variant: ToastVariant;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string, options?: ToastOptions) => void;
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
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;

      setToasts((current) => [...current, { id, variant, message, action: options?.action }].slice(-MAX_TOASTS));

      // Toast com ação de recuperação não some sozinho (salvo duração explícita): o usuário precisa
      // de tempo para reagir. Sem ação, usa a duração padrão da variante.
      const duration = options?.durationMs ?? (options?.action ? null : DEFAULT_DURATION_MS[variant]);
      if (duration === null) return;

      const timer = setTimeout(() => dismissToast(id), duration);
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
