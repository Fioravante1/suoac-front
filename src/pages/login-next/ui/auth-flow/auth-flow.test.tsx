import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../api", () => ({
  confirmCircuitSignupAction: vi.fn(),
  requestPasswordResetAction: vi.fn(),
  signInAction: vi.fn(),
  submitCircuitSignupAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const { AuthFlow } = await import("./auth-flow");

describe("AuthFlow", () => {
  it("abre a recuperação de senha e permite voltar à entrada", () => {
    render(<AuthFlow />);

    fireEvent.click(screen.getByRole("button", { name: "Esqueci a senha" }));
    expect(screen.getByRole("heading", { name: "Recuperar senha" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("abre o autocadastro de circuito e permite voltar à entrada", () => {
    render(<AuthFlow />);

    fireEvent.click(screen.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/ }));
    expect(screen.getByRole("heading", { name: "Cadastre seu circuito" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});
