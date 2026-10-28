"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `true` no navegador e `false` no servidor, sem `setState` em efeito. Serve a
 * quem renderiza em portal: no SSR nao existe `document`, e o snapshot do
 * servidor evita divergencia de hidratacao.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
