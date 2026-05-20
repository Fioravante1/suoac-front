import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

vi.mock("@/shared/auth", () => ({
  useAuth: vi.fn(() => ({ user: { name: "João Silva" }, isAuthenticated: true })),
}));

vi.mock("@/features/sign-in", () => ({
  signOutAction: vi.fn(),
}));

import { DesktopSidebar } from "./desktop-sidebar";

describe("DesktopSidebar", () => {
  it("renderiza todos os itens de navegacao", () => {
    render(<DesktopSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Congregações")).toBeInTheDocument();
    expect(screen.getByText("Passageiros")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("renderiza o logo SUOAC", () => {
    render(<DesktopSidebar />);

    expect(screen.getByText("SUOAC")).toBeInTheDocument();
  });

  it("renderiza o nome do usuario", () => {
    render(<DesktopSidebar />);

    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("renderiza o botao de logout", () => {
    render(<DesktopSidebar />);

    expect(screen.getByRole("button", { name: /Sair/i })).toBeInTheDocument();
  });
});
