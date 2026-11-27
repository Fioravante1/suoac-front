import type { ReactNode } from "react";
import { QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { createQueryClient, queryKeys } from "@/shared/api";

const mocks = vi.hoisted(() => ({ action: vi.fn(), success: vi.fn(), error: vi.fn(), redirect: vi.fn() }));
vi.mock("../publish-event-action", () => ({ publishEventAction: mocks.action }));
vi.mock("@/shared/ui/toast", () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }));
vi.mock("@/shared/auth", () => ({ redirectOnAuthError: mocks.redirect }));
import { usePublishEvent } from "./use-publish-event";

function setup() {
  const client = createQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { ...renderHook(() => ({ hero: usePublishEvent("e1"), card: usePublishEvent("e1") }), { wrapper }), client };
}

describe("usePublishEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockReturnValue(false);
  });
  afterEach(() => onlineManager.setOnline(true));
  it("publica, preserva os dias e a seleção e invalida as listas e o dashboard", async () => {
    mocks.action.mockResolvedValue({ success: true, data: { id: "e1", status: "OPEN" } });
    const { result, client } = setup();
    client.setQueryData(queryKeys.events.detail("e1"), { id: "e1", status: "DRAFT", days: [{ id: "d1" }] });
    client.setQueryData(queryKeys.events.selected("c1"), { id: "e1" });
    client.setQueryData(queryKeys.events.select("c1"), []);
    client.setQueryData(queryKeys.dashboard.byEvent("e1"), {});
    act(() => result.current.hero.publish());
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Evento publicado · inscrições abertas."));
    expect(client.getQueryData(queryKeys.events.detail("e1"))).toMatchObject({ status: "OPEN", days: [{ id: "d1" }] });
    expect(client.getQueryState(queryKeys.events.selected("c1"))?.isInvalidated).toBe(false);
    expect(client.getQueryState(queryKeys.events.select("c1"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.dashboard.byEvent("e1"))?.isInvalidated).toBe(true);
  });

  it.each(["422: Pelo menos um dia ativo", "403: Sem permissão"])("expõe %s e mantém o rascunho", async (error) => {
    mocks.action.mockResolvedValue({ success: false, error });
    const { result, client } = setup();
    client.setQueryData(queryKeys.events.detail("e1"), { status: "DRAFT" });
    act(() => result.current.card.publish());
    await waitFor(() => expect(result.current.card.error).toBe(error));
    expect(mocks.error).toHaveBeenCalledWith(error);
    expect(client.getQueryData(queryKeys.events.detail("e1"))).toEqual({ status: "DRAFT" });
    act(() => result.current.card.clearError());
    expect(result.current.card.error).toBeNull();
  });

  it("falha sem rede imediatamente, sem ficar publicando", async () => {
    onlineManager.setOnline(false);
    mocks.action.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = setup();
    act(() => result.current.hero.publish());
    await waitFor(() => expect(result.current.hero.error).toBe("Não foi possível publicar o evento."));
    await waitFor(() => expect(result.current.hero.isPublishing).toBe(false));
  });

  it("redireciona quando a sessão expira", async () => {
    mocks.redirect.mockReturnValue(true);
    mocks.action.mockResolvedValue({ success: false, error: "Sessão expirada" });
    const { result } = setup();
    act(() => result.current.hero.publish());
    await waitFor(() => expect(mocks.redirect).toHaveBeenCalledWith("Sessão expirada"));
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("impede publicações duplicadas entre hero e card antes de renderizar de novo", async () => {
    let finish: (result: unknown) => void = () => {};
    mocks.action.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = setup();
    act(() => {
      result.current.hero.publish();
      result.current.card.publish();
      result.current.hero.publish();
    });
    await waitFor(() => expect(mocks.action).toHaveBeenCalledTimes(1));
    await act(async () => finish({ success: true, data: { id: "e1", status: "OPEN" } }));
  });

  it.each(["Transição inválida: OPEN → OPEN", "403: Sem permissão", "rede"])(
    "recarrega o evento e o dashboard após %s sem invalidar a seleção",
    async (error) => {
      if (error === "rede") mocks.action.mockRejectedValue(new Error("Failed to fetch"));
      else mocks.action.mockResolvedValue({ success: false, error });
      const { result, client } = setup();
      client.setQueryData(queryKeys.events.detail("e1"), { status: "DRAFT" });
      client.setQueryData(queryKeys.events.selected("c1"), { id: "e1" });
      client.setQueryData(queryKeys.events.select("c1"), []);
      client.setQueryData(queryKeys.dashboard.byEvent("e1"), {});
      act(() => result.current.hero.publish());
      await waitFor(() => expect(client.getQueryState(queryKeys.events.detail("e1"))?.isInvalidated).toBe(true));
      expect(client.getQueryState(queryKeys.events.selected("c1"))?.isInvalidated).toBe(false);
      expect(client.getQueryState(queryKeys.events.select("c1"))?.isInvalidated).toBe(true);
      expect(client.getQueryState(queryKeys.dashboard.byEvent("e1"))?.isInvalidated).toBe(true);
    },
  );
});
