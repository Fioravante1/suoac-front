import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { camelToKebab, extractDeclarationsOf, loadCss } from "@/shared/theme-testing";

import { themeTokens } from "./theme-tokens";

/**
 * `@media` nao le `var()`, entao os CSS Modules repetem as larguras de corte do
 * web responsivo (SUC-83) como numero. Este teste e o que impede essa copia de
 * se afastar do token: um corte inventado numa tela viraria um quarto layout,
 * que ninguem desenhou.
 */
const declarations = extractDeclarationsOf(loadCss("app/globals.css"), ":root");

const declaredBreakpoints: string[] = Object.values(themeTokens.breakpoint);

const { tablet, desktop, desktopWide, panelDesktop } = themeTokens.breakpoint;

/** Telas de acesso: desktop a partir de 1024px. */
const ACCESS_BREAKPOINTS = [tablet, desktop, desktopWide];

/** Painel (area logada, Fatia 2): desktop a partir de 1280px. */
const PANEL_BREAKPOINTS = [tablet, panelDesktop];

/**
 * Cada diretorio responsivo e os cortes da area a que pertence. Um corte de
 * outra area seria um layout que ninguem desenhou: o login cortando em 1280px,
 * ou o painel em 1024px.
 */
const RESPONSIVE_DIRECTORIES: ReadonlyArray<[string, readonly string[]]> = [
  ["src/widgets/auth-shell", ACCESS_BREAKPOINTS],
  ["src/pages/login", ACCESS_BREAKPOINTS],
  ["src/pages/reset-password", ACCESS_BREAKPOINTS],
  ["src/pages/accept-invitation", ACCESS_BREAKPOINTS],
  ["src/shared/ui/password-strength-meter", ACCESS_BREAKPOINTS],
  ["src/shared/ui/checkbox", ACCESS_BREAKPOINTS],
  ["src/shared/ui/theme-toggle", ACCESS_BREAKPOINTS],
  ["src/shared/ui/modal-next", PANEL_BREAKPOINTS],
];

function cssModulesUnder(directory: string): string[] {
  return readdirSync(join(process.cwd(), directory), { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".module.css"))
    .map((file) => join(directory, file));
}

describe("larguras de corte do web responsivo", () => {
  it.each(Object.entries(themeTokens.breakpoint))("espelha %s do CSS no TypeScript", (name, value) => {
    expect(declarations.get(`--suoac-breakpoint-${camelToKebab(name)}`)).toBe(value);
  });

  it("declara os cortes do menor para o maior", () => {
    const widths = declaredBreakpoints.map((value) => Number.parseFloat(value));
    const ascending = widths.toSorted((left, right) => left - right);

    expect(widths).toEqual(ascending);
    expect(new Set(widths).size).toBe(widths.length);
  });

  it.each(RESPONSIVE_DIRECTORIES)("so usa os cortes da sua area nos CSS Modules de %s", (directory, allowed) => {
    // Qualquer condicao de largura, em qualquer unidade: `max-width` ou `px` tambem
    // abririam um layout que ninguem desenhou.
    const widthConditions = cssModulesUnder(directory).flatMap((file) => {
      const css = loadCss(file);

      return [...css.matchAll(/\(\s*(min|max)-width:\s*([\d.]+)(\w+)\s*\)/g)].map(([, kind, value, unit]) => ({
        kind,
        width: `${value}${unit}`,
      }));
    });

    const outsideArea = widthConditions.filter(({ kind, width }) => kind !== "min" || !allowed.includes(width));

    expect(outsideArea).toEqual([]);
  });
});
