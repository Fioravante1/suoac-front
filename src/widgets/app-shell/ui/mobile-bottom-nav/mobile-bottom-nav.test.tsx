import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

const mockUseAuthPermissions = vi.fn();

vi.mock("@/shared/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/auth")>();
  return {
    ...actual,
    useAuthPermissions: (...args: unknown[]) => mockUseAuthPermissions(...args),
  };
});

vi.mock("@/features/sign-in", () => ({
  signOutAction: vi.fn(),
}));

import { MobileBottomNav } from "./mobile-bottom-nav";

describe("MobileBottomNav", () => {
  it("renderiza todos os 4 itens para CIRCUIT_COORDINATOR", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<MobileBottomNav />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Passageiros")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
  });

  it("renderiza todos os 4 itens para CONGREGATION_COORDINATOR", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "Maria Souza", role: "CONGREGATION_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<MobileBottomNav />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Passageiros")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
  });

  it("nao renderiza itens exclusivos do desktop", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<MobileBottomNav />);

    expect(screen.queryByText("Congregações")).not.toBeInTheDocument();
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
  });

  it("renderiza o botao de sair", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<MobileBottomNav />);

    expect(screen.getByRole("button", { name: /Sair/i })).toBeInTheDocument();
  });

  it("nao renderiza itens de navegacao quando nao ha usuario", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(<MobileBottomNav />);

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Eventos")).not.toBeInTheDocument();
  });
});
