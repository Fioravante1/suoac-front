import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  readAppliedTheme,
  readThemeCookie,
  renderWithTheme,
  resetThemeEnvironment,
  stubSystemColorScheme,
} from "@/shared/theme-testing";
import { useTheme } from "./theme-context";

function ThemeConsumer() {
  const { preference, setPreference, toggle } = useTheme();

  return (
    <>
      <span data-testid="preference">{preference ?? "sem-preferencia"}</span>
      <button onClick={toggle}>Alternar</button>
      <button onClick={() => setPreference("system")}>Usar sistema</button>
    </>
  );
}

function clickToggle() {
  fireEvent.click(screen.getByRole("button", { name: "Alternar" }));
}

beforeEach(resetThemeEnvironment);
afterEach(() => vi.unstubAllGlobals());

describe("ThemeProvider", () => {
  it("começa com a preferência que veio do servidor", () => {
    renderWithTheme(<ThemeConsumer />, { preference: "dark" });

    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
  });

  it("distingue ausência de preferência de tema do sistema", () => {
    renderWithTheme(<ThemeConsumer />);

    expect(screen.getByTestId("preference")).toHaveTextContent("sem-preferencia");
  });

  it("aplica o tema no documento e grava o cookie ao escolher", () => {
    renderWithTheme(<ThemeConsumer />);

    fireEvent.click(screen.getByRole("button", { name: "Usar sistema" }));

    expect(readAppliedTheme()).toBe("system");
    expect(readThemeCookie()).toBe("system");
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
  });

  describe("alternância", () => {
    it("vai para o escuro quando não há preferência, porque a página está clara", () => {
      renderWithTheme(<ThemeConsumer />);

      clickToggle();

      expect(readAppliedTheme()).toBe("dark");
    });

    it("volta para o claro quando o tema escolhido é escuro", () => {
      applyTheme("dark");
      renderWithTheme(<ThemeConsumer />, { preference: "dark" });

      clickToggle();

      expect(readAppliedTheme()).toBe("light");
    });

    it("sai de 'sistema' para o oposto do que o sistema operacional está pintando", () => {
      stubSystemColorScheme({ dark: true });
      applyTheme("system");
      renderWithTheme(<ThemeConsumer />, { preference: "system" });

      clickToggle();

      expect(readAppliedTheme()).toBe("light");
    });

    it("ignora a preferência do sistema quando nenhum tema está aplicado", () => {
      // Sistema em escuro, mas sem atributo: a página está clara, então alternar
      // precisa levar ao escuro — e não ao claro.
      stubSystemColorScheme({ dark: true });
      renderWithTheme(<ThemeConsumer />);

      clickToggle();

      expect(readAppliedTheme()).toBe("dark");
    });
  });
});

describe("useTheme", () => {
  it("falha de forma explícita fora do provider", () => {
    const silencedConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Renderizado sem o provider de propósito, por isso não usa renderWithTheme.
    expect(() => render(<ThemeConsumer />)).toThrow(/ThemeProvider/);

    silencedConsoleError.mockRestore();
  });
});
