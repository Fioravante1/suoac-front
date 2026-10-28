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

/** Telas de acesso, as primeiras adaptadas ao celular e ao tablet. */
const RESPONSIVE_DIRECTORIES = [
  "src/widgets/auth-shell",
  "src/pages/login",
  "src/pages/reset-password",
  "src/pages/accept-invitation",
  "src/shared/ui/password-strength-meter",
  "src/shared/ui/checkbox",
  "src/shared/ui/theme-toggle",
];

const declaredBreakpoints: string[] = Object.values(themeTokens.breakpoint);

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

  it.each(RESPONSIVE_DIRECTORIES)("so usa cortes declarados nos CSS Modules de %s", (directory) => {
    // Qualquer condicao de largura, em qualquer unidade: `max-width` ou `px` tambem
    // abririam um layout que ninguem desenhou.
    const widthConditions = cssModulesUnder(directory).flatMap((file) => {
      const css = loadCss(file);

      return [...css.matchAll(/\(\s*(min|max)-width:\s*([\d.]+)(\w+)\s*\)/g)].map(([, kind, value, unit]) => ({
        kind,
        width: `${value}${unit}`,
      }));
    });

    const undeclared = widthConditions.filter(
      ({ kind, width }) => kind !== "min" || !declaredBreakpoints.includes(width),
    );

    expect(undeclared).toEqual([]);
  });
});
