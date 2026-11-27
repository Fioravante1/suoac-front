import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES } from "@/shared/auth";

import { AccountCircuit } from "./account-circuit";

vi.mock("@/shared/auth", async (original) => ({
  ...(await original<typeof import("@/shared/auth")>()),
  useAuthPermissions: () => ({
    isCircuitUser: mocks.isCircuitUser,
    userCongregationId: "claim-congregation",
    userRole: USER_ROLES.CIRCUIT_COORDINATOR,
  }),
}));

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), refetch: vi.fn(), isCircuitUser: true }));

vi.mock("@/shared/api", async (original) => ({
  ...(await original<typeof import("@/shared/api")>()),
  useQuery: mocks.useQuery,
}));
vi.mock("@/entities/circuit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/circuit")>();

  return { ...original, ownCircuitOptions: (circuitId: string) => ({ queryKey: ["circuit", circuitId] }) };
});

const circuit = { id: "circuit-1", name: "SP-17", city: "Campinas", state: "SP" };

function mockQuery(state: Partial<{ data: unknown; isLoading: boolean; isError: boolean; isFetching: boolean }>) {
  mocks.useQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: mocks.refetch,
    ...state,
  });
}

describe("AccountCircuit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isCircuitUser = true;
  });

  it("busca o circuito da sessão", () => {
    mockQuery({ data: circuit });

    render(<AccountCircuit circuitId="circuit-1" />);

    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["circuit", "circuit-1"] }));
  });

  it("mostra o nome do circuito e, embaixo, a cidade e a UF", () => {
    mockQuery({ data: circuit });

    render(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByText("Circuito SP-17")).toBeInTheDocument();
    expect(screen.getByText("Campinas, SP")).toBeInTheDocument();
  });

  it("mostra o carregamento enquanto o circuito não chega", () => {
    mockQuery({ isLoading: true });

    render(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByRole("status", { name: "Carregando o circuito" })).toBeInTheDocument();
    expect(screen.queryByText(/Circuito SP-17/)).not.toBeInTheDocument();
  });

  it("com falha, explica o que houve e oferece tentar de novo", () => {
    mockQuery({ isError: true });

    render(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByText("Não foi possível carregar o circuito.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("desabilita a nova tentativa enquanto ela está a caminho", () => {
    mockQuery({ isError: true, isFetching: true });

    render(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeDisabled();
  });

  it("mantém o circuito na tela quando só a atualização em segundo plano falha", () => {
    mockQuery({ data: circuit, isError: true });

    render(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByText("Circuito SP-17")).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível carregar o circuito.")).not.toBeInTheDocument();
  });

  it("identifica a própria congregação no menu", () => {
    mocks.isCircuitUser = false;
    mocks.useQuery.mockImplementation((options) => {
      const data =
        options.queryKey[0] === "circuit" ? circuit : { id: "congregation-1", name: "Jardim Paulista", code: "31245" };
      return { data, isLoading: false, isError: false, isFetching: false, refetch: mocks.refetch };
    });
    render(<AccountCircuit circuitId="circuit-1" />);
    expect(screen.getByText("Congregação")).toBeInTheDocument();
    expect(screen.getByText("Jardim Paulista · Cód. 31245")).toBeInTheDocument();
    expect(screen.getByText("Circuito SP-17")).toBeInTheDocument();
  });

  it("para a congregação, fala da congregação ao carregar e ao falhar", () => {
    mocks.isCircuitUser = false;
    mockQuery({ isLoading: true });
    const { rerender } = render(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByRole("status", { name: "Carregando a congregação" })).toBeInTheDocument();

    mockQuery({ isError: true });
    rerender(<AccountCircuit circuitId="circuit-1" />);

    expect(screen.getByText("Não foi possível carregar a congregação.")).toBeInTheDocument();
  });

  it("não dispara consulta de congregação para papel do circuito", () => {
    mockQuery({ data: circuit });
    render(<AccountCircuit circuitId="circuit-1" />);
    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["congregations"]),
        enabled: false,
      }),
    );
  });
});
