import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUseAuthPermissions = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/shared/auth", () => ({
  useAuthPermissions: () => mockUseAuthPermissions(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  useQuery: (options: unknown) => mockUseQuery(options),
}));

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib")>()),
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

import { FinancialPage } from "./financial-page";

const summary = {
  eventId: "evt-1",
  eventTitle: "Assembleia",
  ticketPrice: "25.00",
  totals: {
    totalPassengers: 48,
    totalExpected: "1000.00",
    totalReceived: "750.00",
    totalPending: "250.00",
    byStatus: { paid: 20, partial: 8, pending: 15, exempt: 5 },
  },
  congregations: [
    {
      congregationId: "c-1",
      congregationName: "Central",
      totalPassengers: 30,
      totalExpected: "600.00",
      totalReceived: "400.00",
      totalPending: "200.00",
      byStatus: { paid: 14, partial: 5, pending: 8, exempt: 3 },
    },
  ],
};

const passenger = {
  id: "ep-1",
  passenger: { id: "p-1", name: "João Silva", rg: "123", phone: null },
  totalAmount: "100.00",
  paidAmount: "40.00",
  paymentStatus: "PARTIAL",
  exemptionReason: null,
  observations: null,
  eventId: "evt-1",
  congregationId: "c-1",
  registeredById: "u-1",
  createdAt: "",
  updatedAt: "",
  days: [],
};

interface QueryState {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
}

const defaultStates: Record<string, QueryState> = {
  "events-select": { data: { data: [{ id: "evt-1", title: "Assembleia" }] } },
  "events-active": { data: { id: "evt-1" } },
  "financial-summary": { data: summary },
  "event-passengers": { data: { data: [passenger], meta: { totalPages: 1 } }, isFetching: false },
  congregations: { data: { data: [{ id: "c-1", name: "Central" }] } },
};

let states: Record<string, QueryState>;

function keyFor(queryKey: readonly unknown[]): string {
  if (queryKey[1] === "events") return queryKey[2] === "active" ? "events-active" : "events-select";
  if (queryKey[1] === "financial-summary") return "financial-summary";
  if (queryKey[1] === "event-passengers") return "event-passengers";
  return "congregations";
}

function setup(isCircuitUser = true) {
  mockUseAuthPermissions.mockReturnValue({ userCircuitId: "circuit-1", isCircuitUser });

  mockUseQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
    const state = states[keyFor(options.queryKey)] ?? {};
    return {
      data: state.data,
      isLoading: state.isLoading ?? false,
      isError: state.isError ?? false,
      isFetching: state.isFetching ?? false,
      refetch: vi.fn(),
    };
  });
}

describe("FinancialPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    states = structuredClone(defaultStates);
  });

  it("renderiza o heading Financeiro", () => {
    setup();
    render(<FinancialPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Financeiro");
  });

  it("perfil de circuito vê cards, resumo por congregação e tabela", () => {
    setup(true);
    render(<FinancialPage />);

    expect(screen.getByText("R$ 1000.00")).toBeInTheDocument();
    expect(screen.getByText("Resumo por congregação")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Congregação" })).toBeInTheDocument();
    expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
  });

  it("perfil de congregação não vê resumo por congregação nem coluna de congregação", () => {
    setup(false);
    render(<FinancialPage />);

    expect(screen.queryByText("Resumo por congregação")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Congregação" })).not.toBeInTheDocument();
  });

  it("exibe empty state quando não há eventos", () => {
    setup();
    states["events-select"] = { data: { data: [] } };
    states["events-active"] = { data: null };
    render(<FinancialPage />);

    expect(screen.getByText("Nenhum evento")).toBeInTheDocument();
  });

  it("exibe erro com retry quando o resumo falha", () => {
    setup();
    states["financial-summary"] = { data: undefined, isError: true };
    render(<FinancialPage />);

    expect(screen.getByText("Não foi possível carregar o resumo financeiro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("exibe erro com retry quando a lista de passageiros falha", () => {
    setup();
    states["event-passengers"] = { data: undefined, isError: true, isFetching: false };
    render(<FinancialPage />);

    expect(screen.getByText("Não foi possível carregar os passageiros")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
