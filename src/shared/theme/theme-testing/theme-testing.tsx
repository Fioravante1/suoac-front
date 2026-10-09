import { render, type RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import type { ReactElement } from "react";

import { ThemeProvider } from "../theme-context";
import { THEME_COOKIE_NAME, type ThemePreference } from "../theme-preference";

/**
 * Apoio aos testes de tema.
 *
 * Reune apenas o **setup mecanico** que se repetiria em todo arquivo: limpar o
 * tema aplicado, simular a preferencia do sistema operacional e montar o
 * provider. O cenario de cada teste — qual tema esta na tela, o que o sistema
 * operacional prefere — continua explicito no proprio teste, porque e ele que
 * da sentido ao caso.
 *
 * Depende de `vitest` e `@testing-library/react`, que sao dependencias de
 * desenvolvimento: este modulo nao e exportado pela Public API do slice e nunca
 * deve ser importado por codigo de producao.
 */

/** Simula o tema preferido no sistema operacional do usuario. */
export function stubSystemColorScheme({ dark }: { dark: boolean }): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

/** Declara qual tema ja esta pintado na pagina, como o servidor teria estampado. */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.dataset.theme = preference;
}

/**
 * Devolve o ambiente ao estado de quem nunca escolheu um tema: sem atributo, sem
 * cookie e com o sistema operacional em claro.
 */
export function resetThemeEnvironment(): void {
  delete document.documentElement.dataset.theme;
  document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;
  stubSystemColorScheme({ dark: false });
}

export function readThemeCookie(): string | undefined {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.split("=")[1];
}

export function readAppliedTheme(): string | undefined {
  return document.documentElement.dataset.theme;
}

interface RenderWithThemeOptions {
  /** Preferencia que o servidor teria lido do cookie. Padrao: nenhuma. */
  preference?: ThemePreference | null;
}

export function renderWithTheme(ui: ReactElement, { preference = null }: RenderWithThemeOptions = {}): RenderResult {
  return render(<ThemeProvider initialPreference={preference}>{ui}</ThemeProvider>);
}
