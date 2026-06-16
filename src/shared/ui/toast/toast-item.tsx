import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";

import type { ToastRecord, ToastVariant } from "./toast-provider";
import styles from "./toast-item.module.css";

const VARIANT_ICONS: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: styles.success,
  error: styles.error,
  info: styles.info,
  warning: styles.warning,
};

interface ToastItemProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = VARIANT_ICONS[toast.variant];
  const isError = toast.variant === "error";

  return (
    <div
      className={`${styles.toast} ${VARIANT_CLASSES[toast.variant]}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <span className={styles.icon}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <p className={styles.message}>{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className={styles.close} onClick={() => onDismiss(toast.id)} aria-label="Fechar">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
