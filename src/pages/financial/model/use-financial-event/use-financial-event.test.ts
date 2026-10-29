import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionResult } from "@/shared/api";
import type { SelectedEventState, WorkingEventState } from "@/features/select-event";

const mocks = vi.hoisted(() => ({
  useWorkingEvent: vi.fn(),
  useQuery: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/features/select-event", () => ({ useWorkingEvent: mocks.useWorkingEvent }));

vi.mock("@/shared/api", () => ({ useQuery: mocks.useQuery }));

vi.mock("@/shared/ui/toast", () => ({ useToast: () => ({ error: mocks.toastError }) }));

vi.mock("@/entities/event", () => ({
  eventSelectOptions: (circuitId: string) => ({ queryKey: ["suoac", "events", "select", circuitId] }),
}));

import { useFinancialEvent } from "./use-financial-event";

type SelectionResult = ActionResult<NonNullable<SelectedEventState["event"]>>;

const circuitEvents = [
  { id: "evt-antigo", title: "Assembleia de março" },
  { id: "evt-aberto", title: "Congresso de agosto" },
];

function mockEventList(events: { id: string; title: string }[] = circuitEvents) {
  mocks.useQuery.mockReturnValue({ data: { data: events }, isLoading: false, isError: false, refetch: vi.fn() });
}

function oldShell(event: { id: string } | null): WorkingEventState {
  return {
    event: event as WorkingEventState["event"],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    selection: null,
  };
}

function newShell(overrides: Partial<SelectedEventState> = {}): WorkingEventState {
  const selection: SelectedEventState = {
    event: { id: "evt-antigo", title: "Assembleia de março" } as SelectedEventState["event"],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isSelecting: false,
    selectEvent: vi.fn().mockResolvedValue({ success: true, data: { id: "evt-aberto" } }),
    ...overrides,
  };

  return {
    event: selection.event,
    isLoading: selection.isLoading,
    isError: selection.isError,
    refetch: selection.refetch,
    selection,
  };
}

/** Uma troca que só volta quando o teste mandar. */
function deferredSelection() {
  let resolve: (result: SelectionResult) => void = () => {};
  const promise = new Promise<SelectionResult>((settle) => {
    resolve = settle;
  });

  return { selectEvent: vi.fn().mockReturnValue(promise), resolve };
}

describe("useFinancialEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventList();
  });

  describe("no shell antigo", () => {
    it("mostra o evento com inscrições abertas por padrão", () => {
      mocks.useWorkingEvent.mockReturnValue(oldShell({ id: "evt-aberto" }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.eventId).toBe("evt-aberto");
      expect(mocks.useWorkingEvent).toHaveBeenCalledWith("circuit-1");
    });

    it("sem evento aberto, mostra o primeiro da lista", () => {
      mocks.useWorkingEvent.mockReturnValue(oldShell(null));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.eventId).toBe("evt-antigo");
    });

    it("a escolha no seletor da tela prevalece e fica só nesta tela", () => {
      mocks.useWorkingEvent.mockReturnValue(oldShell({ id: "evt-aberto" }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));
      act(() => result.current.changeEvent("evt-antigo"));

      expect(result.current.eventId).toBe("evt-antigo");
      expect(result.current.isChangingEvent).toBe(false);
    });
  });

  describe("no shell novo", () => {
    it("mostra o evento selecionado na faixa", () => {
      mocks.useWorkingEvent.mockReturnValue(newShell());

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.eventId).toBe("evt-antigo");
    });

    it("o seletor da tela troca o evento do shell inteiro e mostra o escolhido na hora", async () => {
      const { selectEvent, resolve } = deferredSelection();
      mocks.useWorkingEvent.mockReturnValue(newShell({ selectEvent }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));
      act(() => result.current.changeEvent("evt-aberto"));

      expect(selectEvent).toHaveBeenCalledWith("evt-aberto");
      expect(result.current.eventId).toBe("evt-aberto");

      // A troca voltou: daqui em diante, quem diz o evento é o shell.
      mocks.useWorkingEvent.mockReturnValue(newShell({ event: { id: "evt-aberto" } as SelectedEventState["event"] }));
      await act(async () =>
        resolve({ success: true, data: { id: "evt-aberto" } as NonNullable<SelectedEventState["event"]> }),
      );

      expect(result.current.eventId).toBe("evt-aberto");
      expect(mocks.toastError).not.toHaveBeenCalled();
    });

    it("volta ao evento do shell e avisa quando a troca falha", async () => {
      const { selectEvent, resolve } = deferredSelection();
      mocks.useWorkingEvent.mockReturnValue(newShell({ selectEvent }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));
      act(() => result.current.changeEvent("evt-aberto"));
      await act(async () => resolve({ success: false, error: "Evento não encontrado." }));

      await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Evento não encontrado."));
      expect(result.current.eventId).toBe("evt-antigo");
    });

    it("avisa que a troca está a caminho", () => {
      mocks.useWorkingEvent.mockReturnValue(newShell({ isSelecting: true }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.isChangingEvent).toBe(true);
    });

    it("põe o evento selecionado no seletor quando ele fica fora da lista", () => {
      const outsideList = { id: "evt-fora", title: "Assembleia de 2019" };
      mocks.useWorkingEvent.mockReturnValue(newShell({ event: outsideList as SelectedEventState["event"] }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.events.map((event) => event.id)).toEqual(["evt-fora", "evt-antigo", "evt-aberto"]);
    });

    it("não repete no seletor o evento selecionado que já está na lista", () => {
      mocks.useWorkingEvent.mockReturnValue(newShell());

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.events).toHaveLength(2);
    });

    it("repassa a falha ao carregar o evento selecionado, com nova tentativa", () => {
      const refetch = vi.fn();
      mocks.useWorkingEvent.mockReturnValue(newShell({ event: undefined, isError: true, refetch }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));
      result.current.retry();

      expect(result.current.isError).toBe(true);
      expect(result.current.eventId).toBe("");
      expect(refetch).toHaveBeenCalled();
    });

    it("circuito sem evento atual fica sem evento, mesmo com eventos na lista", () => {
      mocks.useWorkingEvent.mockReturnValue(newShell({ event: null }));

      const { result } = renderHook(() => useFinancialEvent("circuit-1"));

      expect(result.current.eventId).toBe("");
      expect(result.current.events).toHaveLength(2);
    });
  });
});
