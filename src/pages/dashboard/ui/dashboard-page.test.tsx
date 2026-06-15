import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { DashboardData } from "../model";

const mockUseAuthPermissions = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/shared/auth", () => ({
  useAuthPermissions: (...args: unknown[]) => mockUseAuthPermissions(...args),
}));

vi.mock("@/shared/api", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@/entities/event", () => ({
  EVENT_STATUS_LABELS: { OPEN: "Inscricoes abertas" },
  EVENT_STATUS_BADGE_VARIANTS: { OPEN: "success" },
  EVENT_TYPE_LABELS: { ASSEMBLY: "Assembleia" },
}));

vi.mock("@/entities/event-passenger", async (importOriginal) => ({
  ...(await importOriginal()),
  PAYMENT_STATUS_LABELS: { PENDING: "Pendente", PARTIAL: "Parcial", PAID: "Pago", EXEMPT: "Isento" },
  PAYMENT_STATUS_BADGE_VARIANTS: { PENDING: "critical", PARTIAL: "attention", PAID: "success", EXEMPT: "info" },
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();

  return {
    ...actual,
    formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
    formatDate: (value: string) => value,
    getGreetingByTime: () => "Bom dia",
  };
});

vi.mock("@/shared/config", () => ({
  routes: {
    eventDetail: (id: string) => `/events/${id}`,
  },
}));

vi.mock("../api", () => ({
  activeEventOptions: vi.fn(),
  dashboardOptions: vi.fn(),
}));

import { DashboardPage } from "./dashboard-page";

const circuitUserAuth = {
  user: { name: "Joao Silva" },
  userCircuitId: "circuit-1",
  userCongregationId: null,
  isCircuitUser: true,
  isAuthenticated: true,
};

const mockDashboardData: DashboardData = {
  event: {
    id: "evt-1",
    title: "Assembleia Regional",
    type: "ASSEMBLY",
    status: "OPEN",
    ticketPrice: "50.00",
    venue: "Salao Norte",
    address: "Rua Exemplo, 100",
    city: "Curitiba",
    state: "PR",
    registrationDeadline: "2099-12-31",
    paymentDeadline: "2099-12-31",
    days: [{ id: "day-1", date: "2099-12-01", label: "Dia 1", dayNumber: 1, status: "ACTIVE" }],
  },
  congregation: null,
  stats: {
    totalPassengers: 42,
    totalExpected: "2100.00",
    totalReceived: "1500.00",
    totalPending: "600.00",
  },
  paymentBreakdown: {
    paid: 20,
    partial: 5,
    pending: 10,
    exempt: 7,
  },
  pendingPassengers: [
    {
      id: "p-1",
      passengerName: "Maria",
      totalAmount: "100.00",
      paidAmount: "50.00",
      pendingAmount: "50.00",
      paymentStatus: "PENDING",
    },
  ],
  totalPendingPassengers: 1,
  passengersByDay: [],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthPermissions.mockReturnValue(circuitUserAuth);
  });

  it("renderiza skeleton durante carregamento", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });

    render(<DashboardPage />);

    expect(screen.getByRole("status", { name: "Carregando dashboard" })).toBeInTheDocument();
  });

  it("renderiza empty state quando nao ha evento ativo", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });

    render(<DashboardPage />);

    expect(screen.getByText("Nenhum evento ativo")).toBeInTheDocument();
  });

  it("renderiza error state em caso de falha", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });

    render(<DashboardPage />);

    expect(screen.getByText("Nao foi possivel carregar o dashboard")).toBeInTheDocument();
  });

  it("renderiza dashboard completo com dados", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "evt-1" },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        data: mockDashboardData,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });

    render(<DashboardPage />);

    expect(screen.getByText(/Joao Silva/)).toBeInTheDocument();
    expect(screen.getByText("Assembleia Regional")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Pagamentos")).toBeInTheDocument();
  });

  it("renderiza saudacao com nome do usuario", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "evt-1" },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        data: mockDashboardData,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });

    render(<DashboardPage />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/Joao Silva!/);
  });

  it("exibe 'Visao geral do circuito' no empty state para usuario de circuito", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: null, isLoading: false, isError: false, refetch: vi.fn() })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });

    render(<DashboardPage />);

    expect(screen.getByText("Visao geral do circuito")).toBeInTheDocument();
  });

  it("nao exibe 'Visao geral do circuito' no empty state para usuario de congregacao", () => {
    mockUseAuthPermissions.mockReturnValue({
      user: { name: "Ana Costa" },
      userCircuitId: "circuit-1",
      userCongregationId: "cong-1",
      isCircuitUser: false,
      isAuthenticated: true,
    });

    mockUseQuery
      .mockReturnValueOnce({ data: null, isLoading: false, isError: false, refetch: vi.fn() })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });

    render(<DashboardPage />);

    expect(screen.queryByText("Visao geral do circuito")).not.toBeInTheDocument();
  });

  it("renderiza lista de congregacoes para usuario de circuito", () => {
    const dataWithSummaries: DashboardData = {
      ...mockDashboardData,
      congregationSummaries: [
        {
          id: "cong-1",
          name: "Central",
          totalPassengers: 10,
          totalExpected: "500.00",
          totalReceived: "400.00",
          paymentStatus: "partial",
        },
      ],
    };

    mockUseQuery
      .mockReturnValueOnce({ data: { id: "evt-1" }, isLoading: false, isError: false, refetch: vi.fn() })
      .mockReturnValueOnce({ data: dataWithSummaries, isLoading: false, isError: false, refetch: vi.fn() });

    render(<DashboardPage />);

    expect(screen.getByText("Congregacoes")).toBeInTheDocument();
    expect(screen.getByText("Central")).toBeInTheDocument();
  });
});
