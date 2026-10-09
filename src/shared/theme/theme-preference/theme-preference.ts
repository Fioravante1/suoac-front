/**
 * Preferencia de tema do usuario.
 *
 * `system` segue `prefers-color-scheme` do sistema operacional. A **ausencia** de
 * preferencia e um quarto estado, distinto de `system`: enquanto houver telas nao
 * redesenhadas, quem nunca escolheu um tema recebe o claro, mesmo com o sistema
 * operacional em escuro. Ver `app/globals.css` e `AGENTS.md` §12.
 */
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Tema efetivamente pintado na tela, depois de resolver `system`. */
export type ResolvedTheme = "light" | "dark";

export const THEME_COOKIE_NAME = "suoac-theme";

/**
 * Um ano. A preferencia de tema e de longa duracao por natureza — reescolher o
 * tema a cada semana seria atrito sem motivo.
 */
export const THEME_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function parseThemePreference(value: string | null | undefined): ThemePreference | null {
  if (!value) return null;

  return THEME_PREFERENCES.find((preference) => preference === value) ?? null;
}

/** Media query usada para resolver `system`, tanto no CSS quanto no JavaScript. */
export const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
