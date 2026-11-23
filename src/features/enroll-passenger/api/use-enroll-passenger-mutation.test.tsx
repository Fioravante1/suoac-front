import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClient, queryKeys } from "@/shared/api";

const mocks = vi.hoisted(() => ({ enrollPassengerAction: vi.fn(), toastSuccess: vi.fn() }));

vi.mock("./enroll-passenger-action", () => ({ enrollPassengerAction: mocks.enrollPassengerAction }));
vi.mock("@/shared/ui/toast", () => ({ useToast: () => ({ success: mocks.toastSuccess }) }));

import { useEnrollPassengerMutation } from "./use-enroll-passenger-mutation";

function renderMutation(eventId: string) {
  const queryClient = createQueryClient();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const { result } = renderHook(() => useEnrollPassengerMutation(eventId), { wrapper });

  return { result, invalidateQueries };
}

describe("useEnrollPassengerMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inscreve no evento, confirma e atualiza inscritos, evento, cadastro, painel e financeiro", async () => {
    mocks.enrollPassengerAction.mockResolvedValue({ success: true, data: { id: "ep-1" } });
    const { result, invalidateQueries } = renderMutation("event-1");

    await act(() => result.current.mutateAsync({ name: "Ana", rg: "12345678X" }));

    expect(mocks.enrollPassengerAction).toHaveBeenCalledWith("event-1", { name: "Ana", rg: "12345678X" });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Passageiro inscrito com sucesso.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.eventPassengers.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.events.detail("event-1") });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.passengers.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.financialSummary.all });
  });

  it("não confirma nem atualiza nada quando a inscrição é recusada: o erro fica no modal", async () => {
    mocks.enrollPassengerAction.mockResolvedValue({ success: false, error: "Passageiro já inscrito." });
    const { result, invalidateQueries } = renderMutation("event-1");

    const response = await act(() => result.current.mutateAsync({ passengerId: "p-1" }));

    expect(response).toEqual({ success: false, error: "Passageiro já inscrito." });
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
