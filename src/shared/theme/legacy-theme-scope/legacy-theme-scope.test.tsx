import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createTokenResolver, extractDeclarationsOf, loadCss } from "@/shared/theme-testing";
import { LegacyThemeScope } from "./legacy-theme-scope";

const globals = loadCss("app/globals.css");
const scopeCss = loadCss("src/shared/theme/legacy-theme-scope/legacy-theme-scope.module.css");

const lightDeclarations = extractDeclarationsOf(globals, ":root");
const darkDeclarations = extractDeclarationsOf(globals, 'html[data-theme="dark"]');
const scopeDeclarations = extractDeclarationsOf(scopeCss, ".scope");

const valueInLight = createTokenResolver(lightDeclarations);
const valueInScope = createTokenResolver(scopeDeclarations, lightDeclarations);

/** Todo token que o tema escuro muda precisa ser desfeito pelo escopo. */
const tokensOverriddenByDarkTheme = [...darkDeclarations.keys()].filter((token) => token.startsWith("--suoac-"));

describe("contenção de tema para telas legadas", () => {
  it("desfaz todo token que o tema escuro sobrescreve", () => {
    const notContained = tokensOverriddenByDarkTheme.filter((token) => !scopeDeclarations.has(token));

    expect(notContained).toEqual([]);
  });

  it("usa exatamente os valores do tema claro", () => {
    const diverging = tokensOverriddenByDarkTheme.filter((token) => valueInScope(token) !== valueInLight(token));

    expect(diverging).toEqual([]);
  });

  it("não redeclara token que o tema escuro não muda", () => {
    // Redeclarar a mais e dívida silenciosa: no dia em que o token mudar no
    // `:root`, o escopo continuaria servindo o valor velho.
    const unnecessary = [...scopeDeclarations.keys()].filter((token) => !darkDeclarations.has(token));

    expect(unnecessary).toEqual([]);
  });

  it("devolve o color-scheme claro, para que controles nativos acompanhem", () => {
    expect(scopeCss).toContain("color-scheme: light");
  });

  it("pinta fundo e cor de texto, por o body ficar fora do escopo", () => {
    // Sem isto, o fundo escuro do body apareceria atrás do conteúdo claro.
    expect(scopeCss).toContain("background-color: var(--suoac-color-background)");
    expect(scopeCss).toContain("color: var(--suoac-color-text-primary)");
  });

  it("declara a data de criação e o card que o remove", () => {
    // É dívida criada de propósito: precisa carregar a própria data de morte.
    expect(scopeCss).toContain("TEMPORARIO");
    expect(scopeCss).toContain("SUC-14");
  });
});

describe("LegacyThemeScope", () => {
  it("renderiza o conteúdo que envolve", () => {
    render(
      <LegacyThemeScope>
        <p>Tela ainda não redesenhada</p>
      </LegacyThemeScope>,
    );

    expect(screen.getByText("Tela ainda não redesenhada")).toBeInTheDocument();
  });

  it("aplica a classe de escopo no elemento que envolve o conteúdo", () => {
    const { container } = render(
      <LegacyThemeScope>
        <p>Conteúdo</p>
      </LegacyThemeScope>,
    );

    // CSS Modules geram a classe com hash, por isso a verificação é por padrão.
    expect(container.firstElementChild?.className).toMatch(/scope/);
  });
});
