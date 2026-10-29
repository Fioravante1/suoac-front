import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SelectedEventState } from "../selected-event-context";

const mocks = vi.hoisted(() => ({
  useSelectedEvent: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("../selected-event-context", () => ({ useSelectedEvent: mocks.useSelectedEvent }));

vi.mock("@/shared/api", () => ({ useQuery: mocks.useQuery }));

vi.mock("@/entities/event", () => ({
  activeEventOptions: (circuitId: string) => ({ queryKey: ["suoac", "events", "active", circuitId] }),
}));

import { useWorkingEvent } from "./use-working-event";

const activeEvent = { id: "evt-aberto", title: "Assembleia com inscrições abertas" };
const chosenEvent = { id: "evt-escolhido", title: "Congresso escolhido na faixa" };

function selectionState(overrides: Partial<SelectedEventState> = {}): SelectedEventState {
  return {
    event: chosenEvent as SelectedEventState["event"],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isSelecting: false,
    selectEvent: vi.fn(),
    ...overrides,
  };
}

describe("useWorkingEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockReturnValue({ data: activeEvent, isLoading: false, isError: false, refetch: vi.fn() });
  });

  it("no shell antigo, segue o evento com inscrições abertas do circuito, sem seleção", () => {
    mocks.useSelectedEvent.mockReturnValue(null);

    const { result } = renderHook(() => useWorkingEvent("circuit-1"));

    expect(result.current.event).toEqual(activeEvent);
    expect(result.current.selection).toBeNull();
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  it("no shell antigo, repassa a falha e a nova tentativa do evento aberto", () => {
    const refetch = vi.fn();
    mocks.useSelectedEvent.mockReturnValue(null);
    mocks.useQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });

    const { result } = renderHook(() => useWorkingEvent("circuit-1"));
    result.current.refetch();

    expect(result.current.isError).toBe(true);
    expect(refetch).toHaveBeenCalled();
  });

  it("no shell novo, segue o evento selecionado na faixa e não consulta o evento aberto", () => {
    const selection = selectionState();
    mocks.useSelectedEvent.mockReturnValue(selection);

    const { result } = renderHook(() => useWorkingEvent("circuit-1"));

    expect(result.current.event).toEqual(chosenEvent);
    expect(result.current.selection).toBe(selection);
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("no shell novo, repassa o carregamento e a falha da seleção", () => {
    const refetch = vi.fn();
    mocks.useSelectedEvent.mockReturnValue(
      selectionState({ event: undefined, isLoading: false, isError: true, refetch }),
    );

    const { result } = renderHook(() => useWorkingEvent("circuit-1"));
    result.current.refetch();

    expect(result.current.isError).toBe(true);
    expect(refetch).toHaveBeenCalled();
  });

  it("no shell novo, circuito sem evento atual fica sem evento", () => {
    mocks.useSelectedEvent.mockReturnValue(selectionState({ event: null }));

    const { result } = renderHook(() => useWorkingEvent("circuit-1"));

    expect(result.current.event).toBeNull();
  });

  it("sem circuito, não consulta nada", () => {
    mocks.useSelectedEvent.mockReturnValue(null);

    renderHook(() => useWorkingEvent(""));

    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
