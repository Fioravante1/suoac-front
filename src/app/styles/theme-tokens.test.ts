import { describe, expect, it } from "vitest";

import {
  camelToKebab,
  createTokenResolver,
  extractBlock,
  extractDeclarationsOf,
  loadCss,
  type TokenResolver,
} from "@/shared/theme-testing";

import { darkThemeTokens, lightThemeTokens, themeTokens, type ThemeVariant } from "./theme-tokens";

/**
 * O projeto mantem os tokens em dois lugares: `app/globals.css` (consumido pelos
 * CSS Modules) e este modulo (consumido por TypeScript). Fonte de verdade dupla
 * so e segura se algo garantir que as duas nao divirjam — e esse algo e este
 * teste.
 */
const css = loadCss("app/globals.css");

const LIGHT_SELECTOR = ":root";
const DARK_SELECTOR = 'html[data-theme="dark"]';
const SYSTEM_DARK_SELECTOR = 'html[data-theme="system"]';

/**
 * Cores cujo valor e deliberadamente o mesmo nos dois temas. Qualquer outra cor
 * precisa de par escuro — ver `darkThemeTokens`.
 */
const COLORS_SHARED_BY_BOTH_THEMES = [
  // Branco sobre navy e sobre a cor primaria do tema claro.
  "--suoac-color-text-inverse",
  // O handoff define um unico scrim de modal.
  "--suoac-color-modal-scrim",
];

const lightDeclarations = extractDeclarationsOf(css, LIGHT_SELECTOR);
const darkDeclarations = extractDeclarationsOf(css, DARK_SELECTOR);
const systemDarkDeclarations = extractDeclarationsOf(css, SYSTEM_DARK_SELECTOR);

const valueInLight = createTokenResolver(lightDeclarations);
const valueInDark = createTokenResolver(darkDeclarations, lightDeclarations);

const lightColorTokens = [...lightDeclarations.keys()].filter((token) => token.startsWith("--suoac-color-"));
const lightShadowTokens = [...lightDeclarations.keys()].filter((token) => token.startsWith("--suoac-shadow-"));

describe("tema escuro no globals.css", () => {
  it("declara os mesmos tokens na escolha explícita e na preferência do sistema", () => {
    expect([...systemDarkDeclarations.keys()].sort()).toEqual([...darkDeclarations.keys()].sort());
  });

  it("declara os mesmos valores nos dois seletores", () => {
    expect(Object.fromEntries(systemDarkDeclarations)).toEqual(Object.fromEntries(darkDeclarations));
  });

  it("dá par escuro a toda cor do tema claro", () => {
    const withoutDarkPair = lightColorTokens.filter((token) => {
      if (COLORS_SHARED_BY_BOTH_THEMES.includes(token)) return false;
      return valueInDark(token) === valueInLight(token);
    });

    expect(withoutDarkPair).toEqual([]);
  });

  it("dá par escuro a toda sombra do tema claro", () => {
    const withoutDarkPair = lightShadowTokens.filter((token) => valueInDark(token) === valueInLight(token));

    expect(withoutDarkPair).toEqual([]);
  });

  it("só aplica o tema escuro mediante opt-in explícito", () => {
    const selectorsUnderSystemPreference = [
      ...css.matchAll(/@media \(prefers-color-scheme: dark\) \{\s*([^{]+)\{/g),
    ].map((occurrence) => occurrence[1].trim());

    expect(selectorsUnderSystemPreference).toEqual([SYSTEM_DARK_SELECTOR]);
  });

  it("troca o color-scheme, para que controles nativos acompanhem o tema", () => {
    expect(extractBlock(css, DARK_SELECTOR)).toContain("color-scheme: dark");
    expect(extractBlock(css, SYSTEM_DARK_SELECTOR)).toContain("color-scheme: dark");
  });
});

describe("espelho TypeScript dos tokens", () => {
  const themes: ReadonlyArray<[string, ThemeVariant, TokenResolver]> = [
    ["claro", lightThemeTokens, valueInLight],
    ["escuro", darkThemeTokens, valueInDark],
  ];

  it.each(themes)("reflete as cores do tema %s declaradas no CSS", (_name, tokens, valueInTheme) => {
    for (const [key, value] of Object.entries(tokens.color)) {
      expect(valueInTheme(`--suoac-color-${camelToKebab(key)}`)).toBe(value.toLowerCase());
    }
  });

  it.each(themes)("reflete as sombras do tema %s declaradas no CSS", (_name, tokens, valueInTheme) => {
    for (const [key, value] of Object.entries(tokens.shadow)) {
      expect(valueInTheme(`--suoac-shadow-${camelToKebab(key)}`)).toBe(value.toLowerCase());
    }
  });

  it.each(themes)("reflete os estados de evento e pagamento do tema %s", (_name, tokens, valueInTheme) => {
    for (const [key, value] of Object.entries(tokens.event)) {
      expect(valueInTheme(`--suoac-color-event-${camelToKebab(key)}`)).toBe(value.toLowerCase());
    }

    for (const [key, value] of Object.entries(tokens.payment)) {
      expect(valueInTheme(`--suoac-color-payment-${camelToKebab(key)}`)).toBe(value.toLowerCase());
    }
  });

  it("cobre no tema escuro toda cor declarada no CSS", () => {
    const expectedTokens = lightColorTokens
      .filter((token) => !token.startsWith("--suoac-color-event-") && !token.startsWith("--suoac-color-payment-"))
      .sort();
    const mirroredTokens = Object.keys(darkThemeTokens.color)
      .map((key) => `--suoac-color-${camelToKebab(key)}`)
      .sort();

    expect(mirroredTokens).toEqual(expectedTokens);
  });

  it("mantém fora do tema escuro o que não muda entre temas", () => {
    expect(themeTokens.typography.fontSize.body).toBe("1rem");
    expect(themeTokens.radius.xl).toBe("20px");
    expect(themeTokens.zIndex.modal).toBe(100);
  });
});
