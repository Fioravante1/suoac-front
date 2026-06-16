import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUseFormStatus = vi.fn();

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: () => mockUseFormStatus(),
}));

import { LogoutButton } from "./logout-button";

describe("LogoutButton (app-shell)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("variante icon: renderiza habilitado quando ocioso", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<LogoutButton variant="icon" />);

    const button = screen.getByRole("button", { name: "Sair" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("variante stacked: exibe o label 'Sair'", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<LogoutButton variant="stacked" />);

    expect(screen.getByText("Sair")).toBeInTheDocument();
  });

  it("desabilita e marca aria-busy enquanto o logout está em andamento", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<LogoutButton variant="icon" />);

    const button = screen.getByRole("button", { name: "Sair" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
