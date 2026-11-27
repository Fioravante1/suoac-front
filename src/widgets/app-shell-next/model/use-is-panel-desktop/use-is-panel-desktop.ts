"use client";

import { useSyncExternalStore } from "react";

const PANEL_DESKTOP_QUERY = "(min-width: 80rem)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const media = window.matchMedia(PANEL_DESKTOP_QUERY);
  media.addEventListener("change", onChange);

  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;

  return window.matchMedia(PANEL_DESKTOP_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * A largura só habilita consultas: o CSS continua responsável pelo layout e pela primeira pintura.
 * O snapshot SSR é false, compartilhado com a hidratação, sem consultas desktop no servidor.
 */
export function useIsPanelDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
