import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithTheme, resetThemeEnvironment } from "@/shared/theme-testing";

// A tela monta o formulário de verdade — é a composição que este teste cobre.
// Só a fronteira com o servidor e com o roteador é substituída: a Server Action
// não roda em jsdom, e o roteador do App Router não existe fora da aplicação.
vi.mock("../../api", () => ({
  requestPasswordResetAction: vi.fn(),
  signInAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const { LoginPage } = await import("./login-page");

beforeEach(resetThemeEnvironment);
afterEach(() => vi.unstubAllGlobals());

describe("LoginPage", () => {
  it("apresenta o sistema de um lado e o acesso do outro", () => {
    renderWithTheme(<LoginPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Coordenação inteligente para o arranjo de ônibus." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Entrar" })).toBeInTheDocument();
  });

  it("traz a jornada do evento e o rodapé institucional", () => {
    renderWithTheme(<LoginPage />);

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Privacidade" })).toBeInTheDocument();
  });

  it("deixa a alternância de tema ao alcance de quem ainda não entrou", () => {
    renderWithTheme(<LoginPage />);

    expect(screen.getByRole("button", { name: "Alternar tema" })).toBeInTheDocument();
  });

  it("pede e-mail e senha", () => {
    renderWithTheme(<LoginPage />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });
});
