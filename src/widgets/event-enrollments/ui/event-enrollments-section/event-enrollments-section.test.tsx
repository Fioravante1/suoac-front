import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";
import { PAYMENT_STATUSES, type EventPassenger } from "@/entities/event-passenger";
import { USER_ROLES } from "@/shared/auth";

import { EventEnrollmentsSection } from "./event-enrollments-section";

const mockInvalidateQueries = vi.fn();

vi.mock("@/shared/api", () => ({
  useQuery: vi.fn().mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
  }),
  useMutation: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  queryKeys: {
    eventPassengers: {
      all: ["event-passengers"],
      list: () => ["event-passengers", "list"],
    },
    events: {
      detail: () => ["events", "detail"],
    },
  },
}));

vi.mock("@/entities/event-passenger", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();

  return {
    ...original,
    eventPassengerListOptions: () => ({
      queryKey: ["event-passengers", "list"],
      queryFn: vi.fn(),
      enabled: true,
    }),
  };
});

vi.mock("@/features/enroll-passenger", () => ({
  EnrollPassengerModal: () => null,
  enrollPassengerAction: vi.fn(),
}));

vi.mock("@/features/update-event-passenger-days", () => ({
  UpdateDaysModal: () => null,
  updateEventPassengerDaysAction: vi.fn(),
}));

vi.mock("@/features/remove-event-passenger", () => ({
  removeEventPassengerAction: vi.fn(),
}));

vi.mock("@/features/register-payment", () => ({
  PassengerPaymentsModal: ({ eventPassenger }: { eventPassenger: EventPassenger }) => (
    <div data-testid="payments-modal-paid-amount">{eventPassenger.paidAmount}</div>
  ),
}));

const basePassenger: EventPassenger = {
  id: "event-passenger-1",
  passenger: {
    id: "passenger-1",
    name: "Maria Silva",
    rg: "12.345.678-9",
    phone: "(11) 99999-9999",
  },
  totalAmount: "75.00",
  paidAmount: "25.00",
  paymentStatus: PAYMENT_STATUSES.PARTIAL,
  exemptionReason: null,
  observations: null,
  eventId: "event-1",
  congregationId: "congregation-1",
  registeredById: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  days: [
    {
      id: "event-passenger-day-1",
      eventDayId: "day-1",
      dayNumber: 1,
      date: "2026-07-10T00:00:00.000Z",
      label: "Dia 1",
      checkedIn: false,
      checkedInAt: null,
    },
  ],
};

const baseEvent: Event = {
  id: "event-1",
  title: "Congresso Regional 2026",
  type: EVENT_TYPES.REGIONAL_CONVENTION,
  ticketPrice: "75.00",
  status: EVENT_STATUSES.OPEN,
  registrationDeadline: "2026-06-15T00:00:00.000Z",
  paymentDeadline: "2026-07-01T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      date: "2026-07-10T00:00:00.000Z",
      label: "Dia 1",
      departureTime: "06:00",
      returnTime: "18:00",
      status: EVENT_DAY_STATUSES.ACTIVE,
      eventId: "event-1",
    },
  ],
};

describe("EventEnrollmentsSection", () => {
  beforeEach(async () => {
    const { useQuery: useQueryMock } = await import("@/shared/api");

    vi.mocked(useQueryMock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQueryMock>);
  });

  it("renderiza o título da seção", () => {
    render(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    expect(screen.getByText("Inscrições")).toBeInTheDocument();
  });

  it("mostra botão de inscrever quando evento está OPEN", () => {
    render(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    expect(screen.getByText("Inscrever passageiro")).toBeInTheDocument();
  });

  it("não mostra botão de inscrever quando evento está CLOSED", () => {
    const closedEvent = { ...baseEvent, status: EVENT_STATUSES.CLOSED as typeof baseEvent.status };

    render(
      <EventEnrollmentsSection
        event={closedEvent}
        userRole={USER_ROLES.CIRCUIT_COORDINATOR}
        userCongregationId={null}
      />,
    );

    expect(screen.queryByText("Inscrever passageiro")).not.toBeInTheDocument();
  });

  it("exibe empty state quando não há inscrições", async () => {
    const { useQuery: useQueryMock } = await import("@/shared/api");

    vi.mocked(useQueryMock).mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQueryMock>);

    render(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    expect(screen.getByText("Nenhuma inscrição")).toBeInTheDocument();
  });

  it("exibe skeleton durante o refetch em background, ocultando os dados anteriores", async () => {
    const { useQuery: useQueryMock } = await import("@/shared/api");

    // Dados em cache presentes, mas refetch em andamento (isFetching): deve mostrar skeleton.
    vi.mocked(useQueryMock).mockReturnValue({
      data: { data: [basePassenger], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } },
      isFetching: true,
      isError: false,
    } as ReturnType<typeof useQueryMock>);

    render(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
    expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument();
  });

  it("organiza ações da tabela em um menu compacto por inscrição", async () => {
    const { useQuery: useQueryMock } = await import("@/shared/api");

    vi.mocked(useQueryMock).mockReturnValue({
      data: { data: [basePassenger], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQueryMock>);

    render(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    const actionsButton = screen.getAllByRole("button", { name: "Ações" })[0];

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(actionsButton);

    const menu = screen.getByRole("menu");

    expect(within(menu).getByRole("menuitem", { name: "Pagamentos" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Editar dias" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Remover inscrição" })).toBeInTheDocument();
  });

  it("atualiza os dados do modal de pagamento quando a lista de inscrições refaz a busca", async () => {
    const { useQuery: useQueryMock } = await import("@/shared/api");
    const updatedPassenger: EventPassenger = { ...basePassenger, paidAmount: "75.00" };

    vi.mocked(useQueryMock).mockReturnValue({
      data: { data: [basePassenger], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQueryMock>);

    const view = render(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Ações" })[0]);
    fireEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: "Pagamentos" }));

    expect(screen.getByTestId("payments-modal-paid-amount")).toHaveTextContent("25.00");

    vi.mocked(useQueryMock).mockReturnValue({
      data: { data: [updatedPassenger], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQueryMock>);

    view.rerender(
      <EventEnrollmentsSection event={baseEvent} userRole={USER_ROLES.CIRCUIT_COORDINATOR} userCongregationId={null} />,
    );

    expect(screen.getByTestId("payments-modal-paid-amount")).toHaveTextContent("75.00");
  });
});
