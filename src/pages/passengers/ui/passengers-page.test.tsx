import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCircuitPassengers, fetchPassengers } from "@/entities/passenger/api";

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
    queryKey: ["passengers", "list", congregationId, page, search],
    queryFn: () => fetchPassengers(congregationId, page, 10, search),
    enabled: Boolean(congregationId),
  }),
  passengerListByCircuitOptions: (circuitId: string, page: number, search: string, congregationId: string) => ({
    queryKey: ["passengers", "listByCircuit", circuitId, page, search, congregationId],
    queryFn: () => fetchCircuitPassengers(circuitId, page, 10, search, congregationId),
    enabled: Boolean(circuitId),
  }),
  fetchPassengers: vi.fn(),
  fetchCircuitPassengers: vi.fn(),
}));

vi.mock("@/entities/congregation/api", () => ({
  congregationSelectOptions: () => ({
    queryKey: ["congregations", "select"],
    queryFn: () =>
      Promise.resolve({
        data: [
          { id: "congregation-1", name: "Congregação A", code: "001", email: "a@test.com", city: "Cidade" },
          { id: "congregation-2", name: "Congregação B", code: "002", email: "b@test.com", city: "Cidade" },
        ],
        meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
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
const fetchCircuitPassengersMock = vi.mocked(fetchCircuitPassengers);

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
    fetchCircuitPassengersMock.mockReturnValue(new Promise(() => {}));
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

  it("exibe campo de busca sem botão Buscar", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText("Buscar passageiro por nome ou RG")).toBeInTheDocument();
    expect(screen.queryByText("Buscar")).not.toBeInTheDocument();
  });

  it("exibe botão Limpar quando há texto no campo de busca", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    const input = screen.getByLabelText("Buscar passageiro por nome ou RG");
    fireEvent.change(input, { target: { value: "João" } });

    expect(screen.getByText("Limpar")).toBeInTheDocument();
  });

  it("não exibe botão Limpar quando campo de busca está vazio", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    expect(screen.queryByText("Limpar")).not.toBeInTheDocument();
  });

  it("limpa o campo de busca ao clicar em Limpar", () => {
    render(<PassengersPage />, { wrapper: createWrapper() });

    const input = screen.getByLabelText("Buscar passageiro por nome ou RG");
    fireEvent.change(input, { target: { value: "João" } });
    fireEvent.click(screen.getByText("Limpar"));

    expect(input).toHaveValue("");
  });

  it("exibe seletor de congregação com opções para usuário de circuito", async () => {
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
    expect(select).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Congregação A")).toBeInTheDocument();
      expect(screen.getByText("Congregação B")).toBeInTheDocument();
    });
  });

  it("exibe 'Todas as congregações' como opção padrão para usuário de circuito", async () => {
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

    expect(screen.getByText("Todas as congregações")).toBeInTheDocument();
  });

  it("usuário de circuito vê todos os passageiros sem seleção de congregação", async () => {
    authMock.user = {
      id: "user-1",
      name: "Coordenador",
      email: "coord@test.com",
      role: "CIRCUIT_COORDINATOR",
      isActive: true,
      circuitId: "circuit-1",
      congregationId: "congregation-1",
    };

    fetchCircuitPassengersMock.mockResolvedValue({
      data: [
        {
          id: "p-1",
          name: "Maria",
          rg: "111",
          phone: null,
          observations: null,
          congregationId: "c-1",
          congregationName: "Congregação A",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<PassengersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText("Maria")[0]).toBeInTheDocument();
    });
  });

  it("botão 'Novo passageiro' fica disabled para circuito sem congregação selecionada", () => {
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

    const button = screen.getByText("+ Novo passageiro");
    expect(button).toBeDisabled();
  });

  it("botão 'Novo passageiro' fica habilitado após selecionar congregação", async () => {
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

    await screen.findByText("Congregação A");

    const select = screen.getByLabelText("Congregação");
    fireEvent.change(select, { target: { value: "congregation-1" } });

    await waitFor(() => {
      expect(screen.getByText("+ Novo passageiro")).not.toBeDisabled();
    });
  });
});
