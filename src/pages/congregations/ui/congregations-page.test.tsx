import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { CongregationsPage } from "./congregations-page";

vi.mock("@/shared/auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      name: "Coordenador",
      email: "coord@test.com",
      role: "CIRCUIT_COORDINATOR",
      isActive: true,
      circuitId: "circuit-1",
      congregationId: null,
    },
    isAuthenticated: true,
  }),
}));

vi.mock("@/entities/congregation/api/congregation.queries", () => ({
  fetchCongregations: vi.fn(),
}));

vi.mock("../api/create-congregation-action", () => ({
  createCongregationAction: vi.fn(),
}));

vi.mock("../api/update-congregation-action", () => ({
  updateCongregationAction: vi.fn(),
}));

vi.mock("../api/delete-congregation-action", () => ({
  deleteCongregationAction: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("CongregationsPage", () => {
  it("renderiza o heading Congregações", () => {
    render(<CongregationsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Congregações");
  });

  it("renderiza o botão de nova congregação", () => {
    render(<CongregationsPage />, { wrapper: createWrapper() });

    expect(screen.getByText("+ Nova Congregação")).toBeInTheDocument();
  });

  it("exibe o skeleton enquanto carrega dados", () => {
    render(<CongregationsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
