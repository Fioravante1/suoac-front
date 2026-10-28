"use client";

import { createPortal } from "react-dom";

import { useIsClient } from "@/shared/lib";

import { ToastItem } from "./toast-item";
import type { ToastRecord } from "./toast-provider";
import styles from "./toaster.module.css";

interface ToasterProps {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
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
