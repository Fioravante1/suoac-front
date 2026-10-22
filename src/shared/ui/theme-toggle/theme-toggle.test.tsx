import { screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readAppliedTheme, renderWithTheme, resetThemeEnvironment } from "@/shared/theme-testing";

import { ThemeToggle } from "./theme-toggle";

function getToggle() {
  return screen.getByRole("button", { name: "Alternar tema" });
}

beforeEach(resetThemeEnvironment);
afterEach(() => vi.unstubAllGlobals());

describe("ThemeToggle", () => {
  it("é um botão acessível com rótulo estável", () => {
    renderWithTheme(<ThemeToggle />);

    expect(getToggle()).toBeInTheDocument();
    expect(getToggle()).toHaveAttribute("type", "button");
  });

  it("alterna o tema aplicado ao documento", () => {
    renderWithTheme(<ThemeToggle />);

    fireEvent.click(getToggle());

    expect(readAppliedTheme()).toBe("dark");
  });

  it("volta ao tema claro em um segundo clique", () => {
    renderWithTheme(<ThemeToggle />);

    fireEvent.click(getToggle());
    fireEvent.click(getToggle());

    expect(readAppliedTheme()).toBe("light");
  });

  it("renderiza os dois ícones, deixando o CSS decidir qual aparece", () => {
    // Escolher o ícone em JavaScript exigiria resolver a preferência do sistema
    // durante a renderização, o que o servidor não tem como fazer — e produziria
    // divergência de hidratação.
    const { container } = renderWithTheme(<ThemeToggle />);

    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("esconde os ícones de tecnologias assistivas", () => {
    const { container } = renderWithTheme(<ThemeToggle />);

    for (const icon of container.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});
