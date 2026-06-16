import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/change-password", () => ({
  ChangePasswordForm: () => <div data-testid="change-password-form" />,
}));

vi.mock("@/features/sign-in", () => ({
  signOutAction: vi.fn(),
}));

import { ChangePasswordPage } from "./change-password-page";

describe("ChangePasswordPage", () => {
  it("renderiza título e instrução de primeiro acesso", () => {
    render(<ChangePasswordPage />);

    expect(screen.getByRole("heading", { name: "Defina sua senha" })).toBeInTheDocument();
    expect(screen.getByText(/no primeiro acesso, crie uma nova senha/i)).toBeInTheDocument();
  });

  it("renderiza o formulário de troca de senha", () => {
    render(<ChangePasswordPage />);

    expect(screen.getByTestId("change-password-form")).toBeInTheDocument();
  });

  it("mantém a opção de sair da conta", () => {
    render(<ChangePasswordPage />);

    expect(screen.getByRole("button", { name: "Sair da conta" })).toBeInTheDocument();
  });
});
