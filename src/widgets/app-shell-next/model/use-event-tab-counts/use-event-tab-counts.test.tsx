import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@/shared/api";

import { useEventTabCounts } from "./use-event-tab-counts";

const mocks = vi.hoisted(() => ({ isCircuitUser: true, fetchEventPassengers: vi.fn(), fetchCongregations: vi.fn() }));

vi.mock("@/entities/event-passenger/api/event-passenger.queries", () => ({
  fetchEventPassengers: mocks.fetchEventPassengers,
  fetchEventPassenger: vi.fn(),
  fetchEventPassengersFinancial: vi.fn(),
}));
vi.mock("@/entities/congregation/api/congregation.queries", () => ({
  fetchCongregations: mocks.fetchCongregations,
  fetchCongregation: vi.fn(),
}));

vi.mock("@/shared/auth", () => ({ useAuthPermissions: () => ({ isCircuitUser: mocks.isCircuitUser }) }));

function page(total: number) {
  return { data: [], meta: { total, page: 1, limit: 10, totalPages: Math.ceil(total / 10) } };
}

// O cliente do app, que lança no error boundary toda falha que não é de sessão. Sem a nova
// tentativa, para a falha chegar logo ao estado de erro.

function createClient() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });

  return client;
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createClient()}>{children}</QueryClientProvider>;
}

describe("useEventTabCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isCircuitUser = true;
  });

  it("conta os inscritos do evento e as congregações do circuito pelo total das listas", async () => {
    mocks.fetchEventPassengers.mockResolvedValue(page(912));
    mocks.fetchCongregations.mockResolvedValue(page(20));

    const { result } = renderHook(() => useEventTabCounts("event-1", "circuit-1"), { wrapper });

    await waitFor(() => expect(result.current).toEqual({ passengers: 912, congregations: 20 }));
    expect(mocks.fetchEventPassengers).toHaveBeenCalledWith("event-1", 1);
    expect(mocks.fetchCongregations).toHaveBeenCalledWith("circuit-1", 1);
  });

  it("deixa o contador de fora enquanto carrega", () => {
    mocks.fetchEventPassengers.mockReturnValue(new Promise(() => {}));
    mocks.fetchCongregations.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useEventTabCounts("event-1", "circuit-1"), { wrapper });

    expect(result.current.passengers).toBeUndefined();
    expect(result.current.congregations).toBeUndefined();
  });

  it("deixa de fora só o contador cuja lista falhou, sem derrubar a tela", async () => {
    mocks.fetchEventPassengers.mockRejectedValue(new Error("falhou"));
    mocks.fetchCongregations.mockResolvedValue(page(20));

    const { result } = renderHook(() => useEventTabCounts("event-1", "circuit-1"), { wrapper });

    await waitFor(() => expect(result.current.congregations).toBe(20));
    // Com a falha já no estado de erro, o hook segue de pé e só o contador some.
    await waitFor(() => expect(mocks.fetchEventPassengers).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.passengers).toBeUndefined();
  });

  it("não busca nada sem evento nem circuito", () => {
    renderHook(() => useEventTabCounts("", ""), { wrapper });

    expect(mocks.fetchEventPassengers).not.toHaveBeenCalled();
    expect(mocks.fetchCongregations).not.toHaveBeenCalled();
  });

  it("não conta ônibus até a Fatia 7", async () => {
    mocks.fetchEventPassengers.mockResolvedValue(page(1));
    mocks.fetchCongregations.mockResolvedValue(page(1));

    const { result } = renderHook(() => useEventTabCounts("event-1", "circuit-1"), { wrapper });

    await waitFor(() => expect(result.current.passengers).toBe(1));
    expect(result.current).not.toHaveProperty("buses");
  });

  it("não busca congregações do circuito para papel de congregação", async () => {
    mocks.isCircuitUser = false;
    mocks.fetchEventPassengers.mockResolvedValue(page(5));
    const { result } = renderHook(() => useEventTabCounts("e1", "c1"), { wrapper });
    await waitFor(() => expect(result.current.passengers).toBe(5));
    expect(mocks.fetchCongregations).not.toHaveBeenCalled();
  });
});
