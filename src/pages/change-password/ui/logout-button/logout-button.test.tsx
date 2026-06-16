import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUseFormStatus = vi.fn();

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: () => mockUseFormStatus(),
}));

import { LogoutButton } from "./logout-button";

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe 'Sair da conta' habilitado quando ocioso", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Sair da conta" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("mostra loading e desabilita o botão enquanto processa", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /Saindo/i });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });
});
