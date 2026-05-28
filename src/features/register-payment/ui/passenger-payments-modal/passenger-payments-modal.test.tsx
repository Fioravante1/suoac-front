import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";
import type { EventPassenger } from "@/entities/event-passenger";

import { PassengerPaymentsModal } from "./passenger-payments-modal";

const mockInvalidateQueries = vi.fn();
const mockMutate = vi.fn();

vi.mock("@/shared/api", () => ({
  useQuery: () => ({
    data: [
      {
        id: "pay-1",
        amount: "50",
        paidAt: "2026-02-01T10:00:00.000Z",
        observations: "Pix",
        eventPassengerId: "ep-1",
        registeredById: "user-1",
        createdAt: "2026-02-01T10:00:00.000Z",
      },
      {
        id: "pay-2",
        amount: "25",
        paidAt: "2026-01-15T10:00:00.000Z",
        observations: null,
        eventPassengerId: "ep-1",
        registeredById: "user-1",
        createdAt: "2026-01-15T10:00:00.000Z",
      },
    ],
    isLoading: false,
  }),
  useMutation: ({ mutationFn }: { mutationFn: unknown }) => ({
    mutate: mockMutate,
    mutateAsync: mutationFn,
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  queryKeys: {
    payments: { list: (id: string) => ["payments", "list", id] },
    eventPassengers: { all: ["event-passengers"] },
  },
}));

vi.mock("@/entities/payment", () => ({
  paymentListOptions: (epId: string) => ({
    queryKey: ["payments", "list", epId],
    queryFn: vi.fn(),
    enabled: true,
  }),
}));

const baseEvent: Event = {
  id: "event-1",
  title: "Assembleia 2026",
  type: EVENT_TYPES.ASSEMBLY,
  ticketPrice: "150.00",
  status: EVENT_STATUSES.OPEN,
  registrationDeadline: "2026-06-15T00:00:00.000Z",
  paymentDeadline: "2026-12-01T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  days: [],
};

const pendingPassenger: EventPassenger = {
  id: "ep-1",
  passenger: { id: "p-1", name: "João Silva", rg: "12345678X", phone: "11999999999" },
  totalAmount: "150.00",
  paidAmount: "75.00",
  paymentStatus: "PARTIAL",
  exemptionReason: null,
  observations: null,
  eventId: "event-1",
  congregationId: "cong-1",
  registeredById: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
  days: [],
};

describe("PassengerPaymentsModal", () => {
  it("renderiza info card com total, pago, restante e status", () => {
    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.getByText("Total:")).toBeInTheDocument();
    expect(screen.getByText("R$ 150,00")).toBeInTheDocument();
    expect(screen.getByText("Pago:")).toBeInTheDocument();
    expect(screen.getByText("Restante:")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 75,00")).toHaveLength(2);
    expect(screen.getByText("Parcial")).toBeInTheDocument();
  });

  it("mostra formulário quando PARTIAL e evento OPEN", () => {
    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.getByRole("button", { name: /registrar pagamento/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
    expect(screen.getByLabelText("Data do pagamento")).toBeInTheDocument();
  });

  it("esconde formulário quando EXEMPT", () => {
    const exemptPassenger: EventPassenger = {
      ...pendingPassenger,
      paymentStatus: "EXEMPT",
      exemptionReason: "Pioneiro regular",
      paidAmount: "0",
    };

    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={exemptPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
    expect(screen.getByText("Isento")).toBeInTheDocument();
    expect(screen.getByText("Pioneiro regular")).toBeInTheDocument();
  });

  it("esconde formulário quando PAID (saldo restante = 0)", () => {
    const paidPassenger: EventPassenger = {
      ...pendingPassenger,
      paymentStatus: "PAID",
      paidAmount: "150.00",
    };

    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={paidPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("mostra mensagem de prazo expirado para role de congregação", () => {
    const expiredEvent: Event = {
      ...baseEvent,
      paymentDeadline: "2020-01-01T00:00:00.000Z",
    };

    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={expiredEvent}
        userRole="CONGREGATION_COORDINATOR"
      />,
    );

    expect(screen.getByText("O prazo de pagamento expirou.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
  });

  it("permite pagamento com prazo expirado para role de circuito", () => {
    const expiredEvent: Event = {
      ...baseEvent,
      paymentDeadline: "2020-01-01T00:00:00.000Z",
    };

    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={expiredEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.queryByText("O prazo de pagamento expirou.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
  });

  it("lista pagamentos existentes", () => {
    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 25,00")).toBeInTheDocument();
    expect(screen.getByText("Pix")).toBeInTheDocument();
  });

  it("exibe título do histórico de pagamentos", () => {
    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.getByText("Histórico de pagamentos")).toBeInTheDocument();
  });

  it("mostra botão de remoção nos pagamentos", () => {
    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /remover pagamento/i });

    expect(deleteButtons.length).toBe(2);
  });

  it("abre confirmação ao clicar em remover pagamento", () => {
    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /remover pagamento/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText("Remover pagamento")).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja remover/)).toBeInTheDocument();
  });

  it("esconde formulário quando evento não é OPEN", () => {
    const closedEvent: Event = { ...baseEvent, status: EVENT_STATUSES.CLOSED };

    render(
      <PassengerPaymentsModal
        open
        onClose={vi.fn()}
        eventPassenger={pendingPassenger}
        event={closedEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
  });

  it("chama onClose ao fechar o modal", () => {
    const onClose = vi.fn();

    render(
      <PassengerPaymentsModal
        open
        onClose={onClose}
        eventPassenger={pendingPassenger}
        event={baseEvent}
        userRole="CIRCUIT_COORDINATOR"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
