"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DARK_COLOR_SCHEME_QUERY,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  type ResolvedTheme,
  type ThemePreference,
} from "../theme-preference";

interface ThemeContextValue {
  /** `null` enquanto o usuario nunca escolheu um tema. */
  preference: ThemePreference | null;
  setPreference: (preference: ThemePreference) => void;
  /** Alterna entre claro e escuro a partir do que esta na tela neste momento. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Grava a preferencia num cookie legivel por JavaScript.
 *
 * Diferente dos cookies de sessao, este nao e `httpOnly`: nao guarda segredo
 * nenhum e precisa ser escrito pelo proprio navegador, para que a troca de tema
 * seja instantanea em vez de depender de uma ida ao servidor.
 */
function persistPreference(preference: ThemePreference): void {
  const secureFlag = window.location.protocol === "https:" ? "; secure" : "";

  document.cookie = `${THEME_COOKIE_NAME}=${preference}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secureFlag}`;
}

/**
 * Descobre o tema que esta pintado agora lendo o DOM, nao o estado do React.
 *
 * Resolver `system` durante a renderizacao causaria divergencia de hidratacao: o
 * servidor nao tem como saber a preferencia do sistema operacional do usuario.
 * Lendo no momento do clique, o problema simplesmente nao existe.
 */
function getAppliedTheme(): ResolvedTheme {
  const appliedPreference = document.documentElement.dataset.theme;

  if (appliedPreference === "dark") return "dark";
  if (appliedPreference === "light") return "light";

  if (appliedPreference === "system" && window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches) {
    return "dark";
  }

  // Sem atributo a pagina fica clara, mesmo com o sistema operacional em escuro.
  return "light";
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Preferencia lida do cookie no servidor. */
  initialPreference: ThemePreference | null;
}

export function ThemeProvider({ children, initialPreference }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference | null>(initialPreference);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    document.documentElement.dataset.theme = nextPreference;
    persistPreference(nextPreference);
    setPreferenceState(nextPreference);
  }, []);

  const toggle = useCallback(() => {
    setPreference(getAppliedTheme() === "dark" ? "light" : "dark");
  }, [setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, setPreference, toggle }),
    [preference, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme precisa estar dentro de <ThemeProvider>.");
  }

  return context;
}
