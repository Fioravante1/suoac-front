import { fireEvent, render, screen } from "@testing-library/react";
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

const mockUseWorkingEvent = vi.fn();

vi.mock("@/features/select-event", () => ({
  useWorkingEvent: () => mockUseWorkingEvent(),
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
  "working-event": { data: { id: "evt-1" } },
  "financial-summary": { data: summary },
  "event-passengers": { data: { data: [passenger], meta: { totalPages: 1 } }, isFetching: false },
  congregations: { data: { data: [{ id: "c-1", name: "Central" }] } },
};

let states: Record<string, QueryState>;

function keyFor(queryKey: readonly unknown[]): string {
  if (queryKey[1] === "events") return "events-select";
  if (queryKey[1] === "financial-summary") return "financial-summary";
  if (queryKey[1] === "event-passengers") return "event-passengers";
  return "congregations";
}

function setup(isCircuitUser = true) {
  mockUseAuthPermissions.mockReturnValue({ userCircuitId: "circuit-1", isCircuitUser });

  // Shell antigo: sem seleção, o evento da tela é o de inscrições abertas.
  mockUseWorkingEvent.mockImplementation(() => ({
    event: states["working-event"]?.data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    selection: null,
  }));

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

  function mockNewShell(selection: {
    event: { id: string } | null | undefined;
    isError?: boolean;
    isSelecting?: boolean;
    selectEvent?: unknown;
    refetch?: () => void;
  }) {
    const refetch = selection.refetch ?? vi.fn();

    mockUseWorkingEvent.mockReturnValue({
      event: selection.event,
      isLoading: false,
      isError: selection.isError ?? false,
      refetch,
      selection: {
        event: selection.event,
        isLoading: false,
        isError: selection.isError ?? false,
        refetch,
        isSelecting: selection.isSelecting ?? false,
        selectEvent: selection.selectEvent ?? vi.fn().mockResolvedValue({ success: true }),
      },
    });
  }

  it("no shell novo, mostra o financeiro do evento selecionado e troca a seleção pelo seletor da tela", () => {
    const selectEvent = vi.fn().mockResolvedValue({ success: true, data: { id: "evt-1" } });
    states["events-select"] = {
      data: {
        data: [
          { id: "evt-1", title: "Assembleia" },
          { id: "evt-2", title: "Congresso" },
        ],
      },
    };
    setup();
    mockNewShell({ event: { id: "evt-2" }, selectEvent });
    render(<FinancialPage />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suoac", "financial-summary", "byEvent", "evt-2"] }),
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Selecionar evento" }), { target: { value: "evt-1" } });

    expect(selectEvent).toHaveBeenCalledWith("evt-1");
  });

  it("no shell novo, mostra erro com nova tentativa quando o evento selecionado não carrega", () => {
    const refetch = vi.fn();
    setup();
    mockNewShell({ event: undefined, isError: true, refetch });
    render(<FinancialPage />);

    expect(screen.getByText("Não foi possível carregar o evento")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum evento")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(refetch).toHaveBeenCalled();
  });

  it("no shell novo, sem evento atual, pede para escolher um evento sem fingir que um está escolhido", () => {
    setup();
    mockNewShell({ event: null });
    render(<FinancialPage />);

    expect(screen.getByText("Nenhum evento selecionado")).toBeInTheDocument();
    expect(screen.queryByText("Não há eventos no circuito para exibir o financeiro.")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Selecionar evento" })).toHaveValue("");
    expect(screen.getByRole("option", { name: "Selecione um evento" })).toBeInTheDocument();
  });

  it("no shell novo, trava o seletor enquanto a troca de evento está a caminho", () => {
    setup();
    mockNewShell({ event: { id: "evt-1" }, isSelecting: true });
    render(<FinancialPage />);

    expect(screen.getByRole("combobox", { name: "Selecionar evento" })).toBeDisabled();
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
    states["working-event"] = { data: null };
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
