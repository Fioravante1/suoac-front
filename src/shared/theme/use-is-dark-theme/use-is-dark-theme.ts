"use client";

import { useSyncExternalStore } from "react";

import { DARK_COLOR_SCHEME_QUERY, getAppliedTheme } from "../theme-preference";

/** Avisa quando o tema pintado muda: o atributo do `<html>` ou, para `system`, o sistema operacional. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  const systemScheme = window.matchMedia(DARK_COLOR_SCHEME_QUERY);

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  systemScheme.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    systemScheme.removeEventListener("change", onChange);
  };
}

function getSnapshot(): boolean {
  return getAppliedTheme() === "dark";
}

/** O servidor não sabe o tema do sistema operacional: renderiza claro, e o cliente corrige. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * O tema escuro está na tela agora, para um controle mostrar o estado de verdade, como o
 * interruptor "Tema escuro" da tela Mais. Lê o DOM, como o `toggle` do `ThemeProvider`, e não a
 * preferência: `system` e "nunca escolheu" só se resolvem no navegador.
 */
export function useIsDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
