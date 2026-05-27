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

import { DesktopSidebar } from "./desktop-sidebar";

describe("DesktopSidebar", () => {
  it("renderiza todos os 6 itens para CIRCUIT_COORDINATOR", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Congregações")).toBeInTheDocument();
    expect(screen.getByText("Passageiros")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("oculta Congregacoes e Configuracoes para CONGREGATION_COORDINATOR", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "Maria Souza", role: "CONGREGATION_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.queryByText("Congregações")).not.toBeInTheDocument();
    expect(screen.getByText("Passageiros")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
  });

  it("renderiza o logo SUOAC", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("SUOAC")).toBeInTheDocument();
  });

  it("renderiza o nome do usuario", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("renderiza o botao de logout", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "João Silva", role: "CIRCUIT_COORDINATOR" },
      isAuthenticated: true,
    });

    render(<DesktopSidebar />);

    expect(screen.getByRole("button", { name: /Sair/i })).toBeInTheDocument();
  });

  it("nao renderiza itens de navegacao quando nao ha usuario", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(<DesktopSidebar />);

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Eventos")).not.toBeInTheDocument();
  });
});
