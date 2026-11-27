import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES, type Event, type EventStatus } from "@/entities/event";
import { CONGREGATION_LIST_STATUSES } from "@/entities/congregation";
import { USER_ROLES } from "@/shared/auth";

import { useEventOverview } from "./use-event-overview";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useSelectedEvent: vi.fn(),
  useAuthPermissions: vi.fn(),
  useEventToday: vi.fn(),
}));

vi.mock("@/features/select-event", () => ({ useSelectedEvent: mocks.useSelectedEvent }));
vi.mock("@/shared/auth", async (original) => ({
  ...(await original<typeof import("@/shared/auth")>()),
  useAuthPermissions: mocks.useAuthPermissions,
}));
vi.mock("../use-event-today", () => ({ useEventToday: mocks.useEventToday }));

vi.mock("@/shared/api", async (original) => ({
  ...(await original<typeof import("@/shared/api")>()),
  useQuery: mocks.useQuery,
}));

function buildEvent(status: EventStatus): Event {
  return {
    id: "event-1",
    title: "Congresso Regional 2026",
    type: EVENT_TYPES.REGIONAL_CONVENTION,
    ticketPrice: "40.00",
    status,
    registrationDeadline: "2026-10-13T02:59:59.999Z",
    paymentDeadline: "2026-10-20T02:59:59.999Z",
    venue: "Salão de Assembleias",
    address: "Rua A, 1",
    city: "Campinas",
    state: "SP",
    observations: null,
    circuitId: "circuit-1",
    createdById: "user-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        date: "2026-10-23T00:00:00.000Z",
        label: "Dia 1",
        departureTime: "06:30",
        returnTime: "18:30",
        status: EVENT_DAY_STATUSES.ACTIVE,
        eventId: "event-1",
      },
    ],
  };
}

function select(event: Event | null, isLoading = false) {
  mocks.useSelectedEvent.mockReturnValue({ event, isLoading, isError: false, refetch: vi.fn() });
}

describe("useEventOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockReturnValue({ data: undefined });
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true, userRole: USER_ROLES.CIRCUIT_COORDINATOR });
    mocks.useEventToday.mockReturnValue("2026-10-07");
  });

  it("fica carregando enquanto o evento selecionado não chega", () => {
    select(null, true);

    expect(renderHook(() => useEventOverview()).result.current).toEqual({ status: "loading" });
  });

  it.each([EVENT_STATUSES.DRAFT, EVENT_STATUSES.CANCELLED])(
    "esconde o resumo do evento %s, que tem outro",
    (status) => {
      select(buildEvent(status));

      expect(renderHook(() => useEventOverview()).result.current).toEqual({ status: "hidden" });
    },
  );

  it("esconde o resumo sem evento", () => {
    select(null);

    expect(renderHook(() => useEventOverview()).result.current).toEqual({ status: "hidden" });
  });

  it("calcula o resumo para o hoje de São Paulo e libera as ações do circuito com inscrições abertas", () => {
    select(buildEvent(EVENT_STATUSES.OPEN));

    const state = renderHook(() => useEventOverview()).result.current;

    expect(state.status).toBe("ready");
    expect(state.status === "ready" && state.overview.summary.countdown).toBe("Faltam 16 dias");
    expect(state.status === "ready" && state.canEnroll).toBe(true);
    expect(state.status === "ready" && state.registrationAction).toBe("close");
  });

  it("não libera as ações para quem é da congregação nem com inscrições encerradas", () => {
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false });
    select(buildEvent(EVENT_STATUSES.OPEN));
    const congregationView = renderHook(() => useEventOverview()).result.current;

    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true, userRole: USER_ROLES.CIRCUIT_COORDINATOR });
    select(buildEvent(EVENT_STATUSES.CLOSED));
    const closedView = renderHook(() => useEventOverview()).result.current;

    expect(congregationView.status === "ready" && congregationView.canEnroll).toBe(false);
    expect(congregationView.status === "ready" && congregationView.registrationAction).toBeNull();
    expect(closedView.status === "ready" && closedView.canEnroll).toBe(false);
    expect(closedView.status === "ready" && closedView.registrationAction).not.toBe("close");
  });

  it("libera reabrir para o circuito com as inscrições encerradas antes do prazo, e não para a congregação", () => {
    select(buildEvent(EVENT_STATUSES.CLOSED));
    const circuitView = renderHook(() => useEventOverview()).result.current;

    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false });
    const congregationView = renderHook(() => useEventOverview()).result.current;

    expect(circuitView.status === "ready" && circuitView.registrationAction).toBe("reopen");
    expect(congregationView.status === "ready" && congregationView.registrationAction).toBeNull();
  });

  it("não oferece encerrar nem reabrir com as inscrições encerradas depois do prazo", () => {
    mocks.useEventToday.mockReturnValue("2026-10-14");
    select(buildEvent(EVENT_STATUSES.CLOSED));

    const state = renderHook(() => useEventOverview()).result.current;

    expect(state.status === "ready" && state.registrationAction).toBeNull();
  });

  it.each([CONGREGATION_LIST_STATUSES.PENDING, CONGREGATION_LIST_STATUSES.FINALIZED])(
    "cadastro segue o status %s da própria lista",
    (status) => {
      mocks.useAuthPermissions.mockReturnValue({
        isCircuitUser: false,
        userCongregationId: "c1",
        isCongregationCoordinator: true,
      });
      mocks.useQuery.mockReturnValue({ data: { status } });
      select(buildEvent(EVENT_STATUSES.OPEN));

      const state = renderHook(() => useEventOverview()).result.current;

      expect(state.status === "ready" && state.canEnroll).toBe(status === CONGREGATION_LIST_STATUSES.PENDING);
      expect(state.status === "ready" && state.canToggleListStatus).toBe(true);
    },
  );

  it.each([
    {
      circuit: true,
      eventStatus: EVENT_STATUSES.CLOSED,
      listStatus: null,
      isListError: false,
      reason: "As inscrições não estão abertas.",
    },
    {
      circuit: false,
      eventStatus: EVENT_STATUSES.OPEN,
      listStatus: CONGREGATION_LIST_STATUSES.FINALIZED,
      isListError: false,
      reason: "A lista da congregação já foi finalizada.",
    },
    {
      circuit: false,
      eventStatus: EVENT_STATUSES.OPEN,
      listStatus: null,
      isListError: false,
      reason: "Carregando o status da lista da congregação.",
    },
    {
      circuit: false,
      eventStatus: EVENT_STATUSES.OPEN,
      listStatus: null,
      isListError: true,
      reason: "Não foi possível confirmar o status da lista da congregação.",
    },
  ])("explica cadastro bloqueado: $reason", ({ circuit, eventStatus, listStatus, isListError, reason }) => {
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: circuit, userCongregationId: "c1" });
    mocks.useQuery.mockReturnValue({ data: listStatus ? { status: listStatus } : undefined, isError: isListError });
    select(buildEvent(eventStatus));

    const state = renderHook(() => useEventOverview()).result.current;

    expect(state.status === "ready" && state.enrollDisabledReason).toBe(reason);
  });
});
