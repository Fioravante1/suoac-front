import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EVENT_DAY_STATUSES,
  EVENT_STATUSES,
  EVENT_TYPES,
  type Event,
  type EventDayInEvent,
  type EventStatus,
} from "@/entities/event";

import type { SelectedEventState } from "../selected-event-context";

const mocks = vi.hoisted(() => ({
  useSelectedEvent: vi.fn(),
  useAuthPermissions: vi.fn(),
  useQuery: vi.fn(),
  prefetchQuery: vi.fn(),
  fetchEvents: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../selected-event-context", () => ({ useSelectedEvent: mocks.useSelectedEvent }));

vi.mock("@/shared/auth", () => ({ useAuthPermissions: mocks.useAuthPermissions }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  useQuery: mocks.useQuery,
  useQueryClient: () => ({ prefetchQuery: mocks.prefetchQuery }),
}));

vi.mock("@/entities/event/api/event.queries", () => ({ fetchEvents: mocks.fetchEvents, fetchEvent: vi.fn() }));

vi.mock("@/shared/ui/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess, error: mocks.toastError }),
}));

import { useEventSwitcher } from "./use-event-switcher";

function buildDay(date: string): EventDayInEvent {
  return {
    id: `day-${date}`,
    dayNumber: 1,
    date: `${date}T00:00:00.000Z`,
    label: "Dia 1",
    departureTime: "06:00",
    returnTime: "18:00",
    status: EVENT_DAY_STATUSES.ACTIVE,
    eventId: "evt",
  };
}

function buildEvent(id: string, title: string, status: EventStatus, dates: string[]): Event {
  return {
    id,
    title,
    type: EVENT_TYPES.ASSEMBLY,
    ticketPrice: "25.00",
    status,
    registrationDeadline: "2026-06-01T00:00:00.000Z",
    paymentDeadline: "2026-06-15T00:00:00.000Z",
    venue: "Salão de Assembleias",
    address: "Rua das Flores, 100",
    city: "Campinas",
    state: "SP",
    observations: null,
    circuitId: "circuit-1",
    createdById: "user-1",
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    days: dates.map(buildDay),
  };
}

const congress = buildEvent("evt-congresso", "Congresso Regional 2026", EVENT_STATUSES.OPEN, [
  "2026-10-23",
  "2026-10-24",
  "2026-10-25",
]);
const assembly = buildEvent("evt-assembleia", "Assembleia de Circuito", EVENT_STATUSES.DRAFT, ["2026-11-14"]);
const finished = buildEvent("evt-representante", "Assembleia com Representante", EVENT_STATUSES.FINISHED, [
  "2026-03-15",
]);

function mockSelection(overrides: Partial<SelectedEventState> = {}): SelectedEventState {
  const selection: SelectedEventState = {
    event: congress,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isSelecting: false,
    selectEvent: vi.fn(),
    ...overrides,
  };
  mocks.useSelectedEvent.mockReturnValue(selection);

  return selection;
}

function mockEventList(events: Event[], overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn();
  mocks.useQuery.mockReturnValue({ data: { data: events }, isFetching: false, isError: false, refetch, ...overrides });

  return refetch;
}

describe("useEventSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // O período omite o ano corrente: o relógio fica parado em 2026.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-29T12:00:00.000Z"));
    mocks.useAuthPermissions.mockReturnValue({ userCircuitId: "circuit-1", isCircuitUser: true });
    mockEventList([finished, congress, assembly]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lista os eventos do circuito do mais recente para o mais antigo, com período e status", () => {
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.events.map(({ title, period, statusLabel }) => [title, period, statusLabel])).toEqual([
      ["Assembleia de Circuito", "14 nov", "Rascunho"],
      ["Congresso Regional 2026", "23–25 out", "Inscrições abertas"],
      ["Assembleia com Representante", "15 mar", "Finalizado"],
    ]);
  });

  it("junta período e status na linha de apoio de cada item", () => {
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.events.map(({ meta }) => meta)).toEqual([
      "14 nov · Rascunho",
      "23–25 out · Inscrições abertas",
      "15 mar · Finalizado",
    ]);
  });

  it("evento sem dias fica só com o status na linha de apoio", () => {
    mockSelection();
    mockEventList([{ ...assembly, days: [] }]);

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.events.map(({ period, meta }) => [period, meta])).toEqual([["", "Rascunho"]]);
  });

  it("marca o evento selecionado e dá a cada status a variante do badge", () => {
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.events.map(({ isSelected, statusVariant }) => [isSelected, statusVariant])).toEqual([
      [false, "neutral"],
      [true, "success"],
      [false, "info"],
    ]);
  });

  it("só busca a lista com o seletor aberto", () => {
    mockSelection();

    const { rerender } = renderHook(({ isOpen }) => useEventSwitcher({ isOpen }), { initialProps: { isOpen: false } });

    expect(mocks.useQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false, throwOnError: false }));

    rerender({ isOpen: true });

    expect(mocks.useQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryKey: ["suoac", "events", "select", "circuit-1"], enabled: true }),
    );
  });

  it("repassa a falha da lista e tenta de novo", () => {
    mockSelection();
    const refetch = mockEventList([], { data: undefined, isError: true });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));
    result.current.retryEvents();

    expect(result.current.isEventsError).toBe(true);
    expect(result.current.isLoadingEvents).toBe(false);
    expect(result.current.events).toEqual([]);
    expect(refetch).toHaveBeenCalled();
  });

  it("numa nova tentativa depois da falha, mostra o carregamento e não o erro", () => {
    mockSelection();
    mockEventList([], { data: undefined, isError: true, isFetching: true });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.isLoadingEvents).toBe(true);
    expect(result.current.isEventsError).toBe(false);
  });

  it("com a lista já carregada, uma atualização que falha mantém a lista e não acende o erro", () => {
    mockSelection();
    mockEventList([congress], { isError: true });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.isEventsError).toBe(false);
    expect(result.current.events.map(({ id }) => id)).toEqual(["evt-congresso"]);
  });

  it("busca a lista antes de abrir, com a mesma chave do seletor", () => {
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: false }));
    result.current.prefetchEvents();

    expect(mocks.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suoac", "events", "select", "circuit-1"] }),
    );
  });

  it("descreve o evento selecionado para o botão do seletor", () => {
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: false }));

    expect(result.current.current).toMatchObject({ title: "Congresso Regional 2026", period: "23–25 out" });
  });

  it("circuito sem evento atual fica sem evento selecionado", () => {
    mockSelection({ event: null });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: false }));

    expect(result.current.current).toBeNull();
    expect(result.current.editEventHref).toBeNull();
  });

  it("repassa o carregamento e a falha do evento selecionado", () => {
    mockSelection({ event: undefined, isLoading: true });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: false }));

    expect(result.current.current).toBeUndefined();
    expect(result.current.isCurrentLoading).toBe(true);
  });

  it("troca o evento do shell e avisa qual ficou selecionado", async () => {
    const selection = mockSelection();
    vi.mocked(selection.selectEvent).mockResolvedValue({ success: true, data: assembly });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));
    result.current.selectEvent("evt-assembleia");

    expect(selection.selectEvent).toHaveBeenCalledWith("evt-assembleia");
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("Evento alterado para Assembleia de Circuito"));
  });

  it("avisa quando a troca falha", async () => {
    const selection = mockSelection();
    vi.mocked(selection.selectEvent).mockResolvedValue({ success: false, error: "Não foi possível trocar o evento." });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));
    result.current.selectEvent("evt-assembleia");

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Não foi possível trocar o evento."));
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("com uma troca a caminho, uma nova escolha não dispara outra troca", () => {
    const selection = mockSelection({ isSelecting: true });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));
    result.current.selectEvent("evt-assembleia");

    expect(selection.selectEvent).not.toHaveBeenCalled();
    expect(result.current.isSelecting).toBe(true);
  });

  it("escolher o evento que já está selecionado não troca nada", () => {
    const selection = mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));
    result.current.selectEvent("evt-congresso");

    expect(selection.selectEvent).not.toHaveBeenCalled();
  });

  it("papel do circuito cria eventos e edita o selecionado enquanto o status aceita edição", () => {
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.createEventHref).toBe("/events");
    expect(result.current.editEventHref).toBe("/events/evt-congresso");
  });

  it("não oferece editar evento finalizado ou cancelado", () => {
    mockSelection({ event: finished });

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.editEventHref).toBeNull();
    expect(result.current.createEventHref).toBe("/events");
  });

  it("papel da congregação não cria nem edita eventos", () => {
    mocks.useAuthPermissions.mockReturnValue({ userCircuitId: "circuit-1", isCircuitUser: false });
    mockSelection();

    const { result } = renderHook(() => useEventSwitcher({ isOpen: true }));

    expect(result.current.createEventHref).toBeNull();
    expect(result.current.editEventHref).toBeNull();
  });

  it("fora do shell novo, acusa a falta do provider", () => {
    mocks.useSelectedEvent.mockReturnValue(null);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useEventSwitcher({ isOpen: false }))).toThrow("SelectedEventProvider");

    consoleError.mockRestore();
  });
});
