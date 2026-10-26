import { screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readAppliedTheme, renderWithTheme, resetThemeEnvironment } from "@/shared/theme-testing";

import { AuthPanel } from "./auth-panel";

beforeEach(resetThemeEnvironment);
afterEach(() => vi.unstubAllGlobals());

describe("AuthPanel", () => {
  it("monta a tela de acesso que recebe", () => {
    renderWithTheme(
      <AuthPanel>
        <h2>Entrar</h2>
      </AuthPanel>,
    );

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("se mantém de pé sem tela montada, enquanto as telas da fatia não existem", () => {
    renderWithTheme(<AuthPanel />);

    expect(screen.getByRole("button", { name: "Alternar tema" })).toBeInTheDocument();
  });

  it("traz a marca no topo, para as telas que abrem sem a apresentação", () => {
    renderWithTheme(<AuthPanel />);

    expect(screen.getByText("SUOAC")).toBeInTheDocument();
  });

  it("permite trocar o tema antes de entrar no sistema", () => {
    renderWithTheme(<AuthPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

    expect(readAppliedTheme()).toBe("dark");
  });

  it("assina o rodapé com o ano corrente, sem depender de alguém lembrar de atualizar", () => {
    vi.useFakeTimers({ now: new Date("2027-03-14") });

    try {
      renderWithTheme(<AuthPanel />);

      expect(screen.getByText("© 2027 SUOAC")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("leva às páginas institucionais", () => {
    renderWithTheme(<AuthPanel />);

    expect(screen.getByRole("link", { name: "Privacidade" })).toHaveAttribute("href", "/privacidade");
    expect(screen.getByRole("link", { name: "Ajuda" })).toHaveAttribute("href", "/ajuda");
  });

  it("abre Privacidade e Ajuda em nova aba, sem perder o formulário em andamento", () => {
    renderWithTheme(<AuthPanel />);

    for (const name of ["Privacidade", "Ajuda"]) {
      const link = screen.getByRole("link", { name });

      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });
});
