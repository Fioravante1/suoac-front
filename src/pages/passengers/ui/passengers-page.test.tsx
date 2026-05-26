import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPassengers } from "@/entities/passenger/api";

import { PassengersPage } from "./passengers-page";

const authMock = vi.hoisted(() => ({
  user: {
    id: "user-1",
    name: "Coordenador",
    email: "coord@test.com",
    role: "CONGREGATION_COORDINATOR",
    isActive: true,
    circuitId: "circuit-1",
    congregationId: "congregation-1",
  },
}));

vi.mock("@/shared/auth", async () => {
  const actual = await vi.importActual<typeof import("@/shared/auth")>("@/shared/auth");

  return {
    ...actual,
    useAuth: () => ({
      user: authMock.user,
      isAuthenticated: true,
    }),
  };
});

vi.mock("@/entities/passenger/api", () => ({
  passengerListOptions: (congregationId: string, page: number, search: string) => ({
    queryKey: ["passengers", congregationId, page, search],
    queryFn: () => fetchPassengers(congregationId, page, 20, search),
    enabled: Boolean(congregationId),
  }),
  fetchPassengers: vi.fn(),
}));

vi.mock("@/entities/congregation/api", () => ({
  congregationListOptions: () => ({
    queryKey: ["congregations"],
    queryFn: () =>
      Promise.resolve({
        data: [
          { id: "congregation-1", name: "Congregação A", code: "001", email: "a@test.com", city: "Cidade" },
          { id: "congregation-2", name: "Congregação B", code: "002", email: "b@test.com", city: "Cidade" },
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      }),
    enabled: true,
  }),
}));

vi.mock("@/features/create-passenger", () => ({
  createPassengerAction: vi.fn(),
}));

vi.mock("@/features/update-passenger", () => ({
  updatePassengerAction: vi.fn(),
}));

vi.mock("@/features/delete-passenger", () => ({
  deletePassengerAction: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const fetchPassengersMock = vi.mocked(fetchPassengers);

describe("PassengersPage", () => {
  beforeEach(() => {
    authMock.user = {
      id: "user-1",
      name: "Coordenador",
      email: "coord@test.com",
      role: "CONGREGATION_COORDINATOR",
      isActive: true,
      circuitId: "circuit-1",
      congregationId: "congregation-1",
    };
    fetchPassengersMock.mockReturnValue(new Promise(() => {}));
  });

  it("renderiza o heading Passageiros", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Passageiros");
  });

  it("renderiza o botão de novo passageiro", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    expect(screen.getByText("+ Novo passageiro")).toBeInTheDocument();
  });

  it("exibe o skeleton enquanto carrega dados", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("permite selecionar congregação para usuário de circuito", async () => {
    authMock.user = {
      id: "user-1",
      name: "Coordenador",
      email: "coord@test.com",
      role: "CIRCUIT_COORDINATOR",
      isActive: true,
      circuitId: "circuit-1",
      congregationId: "congregation-1",
    };

    render(<PassengersPage />, { wrapper: createWrapper() });

    const select = await screen.findByLabelText("Congregação");
    fireEvent.change(select, { target: { value: "congregation-2" } });

    await waitFor(() => {
      expect(select).toHaveValue("congregation-2");
    });
  });
});
