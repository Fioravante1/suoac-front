import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";
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
});
