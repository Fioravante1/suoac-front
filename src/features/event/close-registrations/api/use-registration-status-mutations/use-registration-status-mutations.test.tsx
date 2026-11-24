import type { ReactNode } from "react";
import { onlineManager, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClient, queryKeys } from "@/shared/api";

const mocks = vi.hoisted(() => ({
  closeRegistrationsAction: vi.fn(),
  reopenRegistrationsAction: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  redirectOnAuthError: vi.fn(),
}));

vi.mock("../registration-status-action", () => ({
  closeRegistrationsAction: mocks.closeRegistrationsAction,
  reopenRegistrationsAction: mocks.reopenRegistrationsAction,
}));
vi.mock("@/shared/ui/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess, error: mocks.toastError }),
}));
vi.mock("@/shared/auth", () => ({ redirectOnAuthError: mocks.redirectOnAuthError }));

import { useCloseRegistrationsMutation, useReopenRegistrations } from "./use-registration-status-mutations";

function renderWithClient<TResult>(hook: () => TResult) {
  const queryClient = createQueryClient();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { ...renderHook(hook, { wrapper }), queryClient, invalidateQueries };
}

describe("useCloseRegistrationsMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("encerra, confirma e recarrega o evento e o painel", async () => {
    mocks.closeRegistrationsAction.mockResolvedValue({ success: true, data: { id: "event-1" } });
    const { result, invalidateQueries } = renderWithClient(() => useCloseRegistrationsMutation("event-1"));

    await act(() => result.current.mutateAsync());

    expect(mocks.closeRegistrationsAction).toHaveBeenCalledWith("event-1");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Inscrições encerradas.");
    expect(invalidateQueries).toHaveBeenCalledWith(expect.objectContaining({ queryKey: queryKeys.events.all }));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.all });
  });

  it("recarrega o detalhe e as listas, mas não a seleção, que trocaria de evento", async () => {
    mocks.closeRegistrationsAction.mockResolvedValue({ success: true, data: { id: "event-1" } });
    const { result, queryClient } = renderWithClient(() => useCloseRegistrationsMutation("event-1"));
    const selectedKey = queryKeys.events.selected("circuit-1");
    const detailKey = queryKeys.events.detail("event-1");
    const listKey = queryKeys.events.select("circuit-1");

    queryClient.setQueryData(selectedKey, { id: "event-1" });
    queryClient.setQueryData(detailKey, { id: "event-1" });
    queryClient.setQueryData(listKey, []);

    await act(() => result.current.mutateAsync());

    expect(queryClient.getQueryState(selectedKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it("recusado, não confirma, mas recarrega o evento: ele pode ter mudado por outro caminho", async () => {
    mocks.closeRegistrationsAction.mockResolvedValue({ success: false, error: "Transição inválida" });
    const { result, invalidateQueries } = renderWithClient(() => useCloseRegistrationsMutation("event-1"));

    const response = await act(() => result.current.mutateAsync());

    expect(response).toEqual({ success: false, error: "Transição inválida" });
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith(expect.objectContaining({ queryKey: queryKeys.events.all }));
  });

  it("devolve a falha quando a action nem responde, como sem rede", async () => {
    mocks.closeRegistrationsAction.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = renderWithClient(() => useCloseRegistrationsMutation("event-1"));

    const response = await act(() => result.current.mutateAsync());

    expect(response).toEqual({ success: false, error: "Não foi possível encerrar as inscrições." });
  });

  it("sem rede, chama a action na hora em vez de segurar a troca até a conexão voltar", async () => {
    onlineManager.setOnline(false);
    mocks.closeRegistrationsAction.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = renderWithClient(() => useCloseRegistrationsMutation("event-1"));

    const response = await act(() => result.current.mutateAsync());

    expect(mocks.closeRegistrationsAction).toHaveBeenCalledWith("event-1");
    expect(response).toEqual({ success: false, error: "Não foi possível encerrar as inscrições." });
  });
});

describe("useReopenRegistrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirectOnAuthError.mockReturnValue(false);
  });

  it("reabre e confirma", async () => {
    mocks.reopenRegistrationsAction.mockResolvedValue({ success: true, data: { id: "event-1" } });
    const { result, invalidateQueries } = renderWithClient(() => useReopenRegistrations("event-1"));

    act(() => result.current.reopen());

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("Inscrições reabertas."));
    expect(invalidateQueries).toHaveBeenCalledWith(expect.objectContaining({ queryKey: queryKeys.events.all }));
  });

  it("mostra a recusa da API num toast, porque reabrir não tem confirmação", async () => {
    mocks.reopenRegistrationsAction.mockResolvedValue({
      success: false,
      error: "O prazo de inscrição já passou: não é possível reabrir as inscrições",
    });
    const { result } = renderWithClient(() => useReopenRegistrations("event-1"));

    act(() => result.current.reopen());

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "O prazo de inscrição já passou: não é possível reabrir as inscrições",
      ),
    );
  });

  it("com a sessão expirada, leva ao login em vez de mostrar o toast", async () => {
    mocks.redirectOnAuthError.mockReturnValue(true);
    mocks.reopenRegistrationsAction.mockResolvedValue({ success: false, error: "Sessão expirada" });
    const { result } = renderWithClient(() => useReopenRegistrations("event-1"));

    act(() => result.current.reopen());

    await waitFor(() => expect(mocks.redirectOnAuthError).toHaveBeenCalledWith("Sessão expirada"));
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("troca a recusa sem texto pela mensagem padrão, em vez de um toast em branco", async () => {
    mocks.reopenRegistrationsAction.mockResolvedValue({ success: false, error: "  " });
    const { result } = renderWithClient(() => useReopenRegistrations("event-1"));

    act(() => result.current.reopen());

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Não foi possível reabrir as inscrições."));
  });

  it("avisa quando a action nem responde, em vez de falhar calado", async () => {
    mocks.reopenRegistrationsAction.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = renderWithClient(() => useReopenRegistrations("event-1"));

    act(() => result.current.reopen());

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Não foi possível reabrir as inscrições."));
  });

  it("não reabre de novo, por outro botão, enquanto uma reabertura está em curso", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.reopenRegistrationsAction.mockReturnValue(new Promise((done) => (resolve = done)));
    const { result } = renderWithClient(() => ({
      summary: useReopenRegistrations("event-1"),
      dock: useReopenRegistrations("event-1"),
    }));

    act(() => result.current.summary.reopen());
    await waitFor(() => expect(result.current.dock.isReopening).toBe(true));
    act(() => result.current.dock.reopen());

    expect(mocks.reopenRegistrationsAction).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ success: true, data: { id: "event-1" } }));
    await waitFor(() => expect(result.current.dock.isReopening).toBe(false));
  });

  it("não reabre duas vezes num clique duplo, antes de a tela saber que reabre", async () => {
    mocks.reopenRegistrationsAction.mockReturnValue(new Promise(() => {}));
    const { result } = renderWithClient(() => useReopenRegistrations("event-1"));

    await act(async () => {
      result.current.reopen();
      result.current.reopen();
    });

    expect(mocks.reopenRegistrationsAction).toHaveBeenCalledTimes(1);
  });
});
