import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { darkThemeTokens, lightThemeTokens, themeTokens, type ThemeVariant } from "./theme-tokens";

/**
 * O projeto mantem os tokens em dois lugares: `app/globals.css` (consumido pelos
 * CSS Modules) e este modulo (consumido por TypeScript). Fonte de verdade dupla
 * so e segura se algo garantir que as duas nao divirjam — e esse algo e este
 * teste.
 */
const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

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

function extractBlock(selector: string): string {
  const selectorIndex = css.indexOf(`${selector} {`);

  if (selectorIndex === -1) {
    throw new Error(`Seletor nao encontrado em app/globals.css: ${selector}`);
  }

  const blockStart = css.indexOf("{", selectorIndex);
  let depth = 0;

  for (let index = blockStart; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(blockStart + 1, index);
    }
  }

  throw new Error(`Bloco sem fechamento em app/globals.css: ${selector}`);
}

function extractDeclarations(block: string): Map<string, string> {
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = new Map<string, string>();

  for (const chunk of withoutComments.split(";")) {
    const declaration = chunk.match(/(--[\w-]+)\s*:\s*([\s\S]+)/);
    if (declaration) declarations.set(declaration[1], declaration[2].trim().replace(/\s+/g, " "));
  }

  return declarations;
}

const lightDeclarations = extractDeclarations(extractBlock(LIGHT_SELECTOR));
const darkDeclarations = extractDeclarations(extractBlock(DARK_SELECTOR));
const systemDarkDeclarations = extractDeclarations(extractBlock(SYSTEM_DARK_SELECTOR));

/** Resolve `var(--x)` ate chegar a um valor literal, como o navegador faria. */
function resolveValue(value: string, theme: Map<string, string>, visited = new Set<string>()): string {
  const reference = value.match(/^var\((--[\w-]+)\)$/);
  if (!reference) return value.toLowerCase();

  const token = reference[1];
  if (visited.has(token)) throw new Error(`Ciclo de var() em ${token}`);
  visited.add(token);

  const next = theme.get(token) ?? lightDeclarations.get(token);
  if (next === undefined) throw new Error(`Token referenciado mas nao declarado: ${token}`);

  return resolveValue(next, theme, visited);
}

function valueInTheme(token: string, theme: Map<string, string>): string {
  const declared = theme.get(token) ?? lightDeclarations.get(token);
  if (declared === undefined) throw new Error(`Token nao declarado: ${token}`);
  return resolveValue(declared, theme);
}

function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

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
      return valueInTheme(token, darkDeclarations) === valueInTheme(token, lightDeclarations);
    });

    expect(withoutDarkPair).toEqual([]);
  });

  it("dá par escuro a toda sombra do tema claro", () => {
    const withoutDarkPair = lightShadowTokens.filter(
      (token) => valueInTheme(token, darkDeclarations) === valueInTheme(token, lightDeclarations),
    );

    expect(withoutDarkPair).toEqual([]);
  });

  it("só aplica o tema escuro mediante opt-in explícito", () => {
    const selectorsUnderSystemPreference = [
      ...css.matchAll(/@media \(prefers-color-scheme: dark\) \{\s*([^{]+)\{/g),
    ].map((occurrence) => occurrence[1].trim());

    expect(selectorsUnderSystemPreference).toEqual([SYSTEM_DARK_SELECTOR]);
  });

  it("troca o color-scheme, para que controles nativos acompanhem o tema", () => {
    expect(extractBlock(DARK_SELECTOR)).toContain("color-scheme: dark");
    expect(extractBlock(SYSTEM_DARK_SELECTOR)).toContain("color-scheme: dark");
  });
});

describe("espelho TypeScript dos tokens", () => {
  const themes: ReadonlyArray<[string, ThemeVariant, Map<string, string>]> = [
    ["claro", lightThemeTokens, lightDeclarations],
    ["escuro", darkThemeTokens, darkDeclarations],
  ];

  it.each(themes)("reflete as cores do tema %s declaradas no CSS", (_name, tokens, declarations) => {
    for (const [key, value] of Object.entries(tokens.color)) {
      expect(valueInTheme(`--suoac-color-${camelToKebab(key)}`, declarations)).toBe(value.toLowerCase());
    }
  });

  it.each(themes)("reflete as sombras do tema %s declaradas no CSS", (_name, tokens, declarations) => {
    for (const [key, value] of Object.entries(tokens.shadow)) {
      expect(valueInTheme(`--suoac-shadow-${camelToKebab(key)}`, declarations)).toBe(value.toLowerCase());
    }
  });

  it.each(themes)("reflete os estados de evento e pagamento do tema %s", (_name, tokens, declarations) => {
    for (const [key, value] of Object.entries(tokens.event)) {
      expect(valueInTheme(`--suoac-color-event-${camelToKebab(key)}`, declarations)).toBe(value.toLowerCase());
    }

    for (const [key, value] of Object.entries(tokens.payment)) {
      expect(valueInTheme(`--suoac-color-payment-${camelToKebab(key)}`, declarations)).toBe(value.toLowerCase());
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
