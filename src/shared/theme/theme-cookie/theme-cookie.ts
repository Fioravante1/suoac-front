import "server-only";

import { cookies } from "next/headers";

import { parseThemePreference, THEME_COOKIE_NAME, type ThemePreference } from "../theme-preference";

/**
 * Le a preferencia de tema no servidor, para que o atributo `data-theme` ja saia
 * estampado no HTML. E o que elimina o flash de tema errado: a primeira pintura
 * do navegador ja acontece no tema certo, sem depender de JavaScript.
 *
 * Devolve `null` quando o usuario nunca escolheu um tema — nesse caso o layout
 * nao estampa atributo nenhum e a pagina fica clara.
 */
export async function getThemePreference(): Promise<ThemePreference | null> {
  const cookieStore = await cookies();

  return parseThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
}
