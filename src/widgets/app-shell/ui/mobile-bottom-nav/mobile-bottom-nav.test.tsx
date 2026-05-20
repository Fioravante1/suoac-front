import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

vi.mock("@/features/sign-in", () => ({
  signOutAction: vi.fn(),
}));

import { MobileBottomNav } from "./mobile-bottom-nav";

describe("MobileBottomNav", () => {
  it("renderiza os itens de navegacao mobile", () => {
    render(<MobileBottomNav />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Passageiros")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
  });

  it("nao renderiza itens exclusivos do desktop", () => {
    render(<MobileBottomNav />);

    expect(screen.queryByText("Congregações")).not.toBeInTheDocument();
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
  });

  it("renderiza o botao de sair", () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole("button", { name: /Sair/i })).toBeInTheDocument();
  });
});
