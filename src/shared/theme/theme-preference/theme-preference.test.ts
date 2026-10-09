import { describe, expect, it } from "vitest";

import { parseThemePreference, THEME_COOKIE_MAX_AGE, THEME_PREFERENCES } from "./theme-preference";

describe("parseThemePreference", () => {
  it.each(THEME_PREFERENCES)("aceita a preferência conhecida %s", (preference) => {
    expect(parseThemePreference(preference)).toBe(preference);
  });

  it("trata ausencia de preferencia como nula, nao como tema do sistema", () => {
    // A distincao e deliberada: sem preferencia a pagina fica clara mesmo com o
    // sistema operacional em escuro, para nao pintar telas ainda nao redesenhadas.
    expect(parseThemePreference(undefined)).toBeNull();
    expect(parseThemePreference(null)).toBeNull();
    expect(parseThemePreference("")).toBeNull();
  });

  it("recusa valor desconhecido vindo do cookie", () => {
    expect(parseThemePreference("escuro")).toBeNull();
    expect(parseThemePreference("DARK")).toBeNull();
    expect(parseThemePreference("<script>")).toBeNull();
  });
});

describe("cookie de tema", () => {
  it("dura um ano", () => {
    expect(THEME_COOKIE_MAX_AGE).toBe(365 * 24 * 60 * 60);
  });
});
