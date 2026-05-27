import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/auth", () => ({
  useAuthPermissions: vi.fn(() => ({
    user: { name: "João Silva" },
    userRole: null,
    userCircuitId: "",
    userCongregationId: null,
    isAuthenticated: true,
    isCircuitUser: false,
    isCircuitCoordinator: false,
    isCircuitAssistant: false,
    isCongregationCoordinator: false,
    isCongregationAssistant: false,
  })),
}));

import { DashboardPage } from "./dashboard-page";

describe("DashboardPage", () => {
  it("renderiza o heading Dashboard", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  });

  it("renderiza a mensagem de boas-vindas com nome do usuario", () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Bem-vindo, João Silva/)).toBeInTheDocument();
  });
});
