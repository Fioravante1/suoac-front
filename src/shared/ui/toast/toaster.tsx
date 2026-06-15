"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ToastItem } from "./toast-item";
import type { ToastRecord } from "./toast-provider";
import styles from "./toaster.module.css";

interface ToasterProps {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}

const emptySubscribe = () => () => {};

// Hidrata só no cliente (snapshot do servidor = false) sem setState em efeito,
// evitando portal durante o SSR e mismatch de hidratação.
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  const isClient = useIsClient();

  if (!isClient) return null;

  return createPortal(
    <div className={styles.region} role="region" aria-label="Notificações">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}
