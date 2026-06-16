"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Spinner } from "@/shared/ui/spinner";

import styles from "./loading-overlay.module.css";

type LoadingOverlayProps = Readonly<{
  open: boolean;
  label?: string;
}>;

const emptySubscribe = () => () => {};

// Hidrata só no cliente (snapshot do servidor = false), evitando portal durante o SSR.
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Overlay de carregamento que cobre a tela inteira, escurece o conteúdo com um leve desfoque
 * e centraliza um spinner com mensagem opcional. Renderizado via portal no `body` para escapar
 * de contextos de empilhamento. Usar em operações que bloqueiam toda a interface e mudam de
 * contexto (ex.: logout), onde um feedback inline pequeno não seria perceptível.
 */
export function LoadingOverlay({ open, label }: LoadingOverlayProps) {
  const isClient = useIsClient();

  if (!isClient || !open) return null;

  return createPortal(
    <div className={styles.overlay} role="alert" aria-live="assertive" aria-busy="true">
      <div className={styles.content}>
        <Spinner size="large" />
        {label && <span className={styles.label}>{label}</span>}
      </div>
    </div>,
    document.body,
  );
}
