import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONGREGATION_LIST_STATUSES } from "@/entities/congregation";
import { EVENT_STATUSES } from "@/entities/event";
import { createQueryClient, queryKeys } from "@/shared/api";

import { useToggleCongregationListStatus } from "./use-congregation-list-status-mutation";

const mocks = vi.hoisted(() => ({ action: vi.fn(), success: vi.fn(), error: vi.fn(), redirect: vi.fn() }));
vi.mock("../update-congregation-list-status-action", () => ({ updateCongregationListStatusAction: mocks.action }));
vi.mock("@/shared/ui/toast", () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }));
vi.mock("@/shared/auth", () => ({ redirectOnAuthError: mocks.redirect }));

const { PENDING, FINALIZED } = CONGREGATION_LIST_STATUSES;

function setup() {
  const client = createQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return {
    ...renderHook(
      () => ({ hero: useToggleCongregationListStatus("e1", "c1"), card: useToggleCongregationListStatus("e1", "c1") }),
      { wrapper },
    ),
    client,
  };
}

describe("alteração da lista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockReturnValue(false);
  });

  it.each([FINALIZED, PENDING])("atualiza cache e informa sucesso %s", async (status) => {
    mocks.action.mockResolvedValue({ success: true, data: { status } });
    const { result, client } = setup();
    act(() => result.current.hero.toggle(status));
    await waitFor(() =>
      expect(client.getQueryData(queryKeys.congregations.eventStatus("e1", "c1"))).toEqual({ status }),
    );
    expect(mocks.success).toHaveBeenCalledWith(status === FINALIZED ? "Lista enviada ao circuito." : "Lista reaberta.");
  });

  it.each(["403", "422", "rede"])("preserva estado anterior na falha %s", async (error) => {
    mocks.action.mockResolvedValue({ success: false, error });
    const { result, client } = setup();
    client.setQueryData(queryKeys.congregations.eventStatus("e1", "c1"), { status: PENDING });
    act(() => result.current.hero.toggle(FINALIZED));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(error));
    expect(client.getQueryData(queryKeys.congregations.eventStatus("e1", "c1"))).toEqual({ status: PENDING });
  });

  it("trava envio simultâneo nos dois resumos", async () => {
    mocks.action.mockReturnValue(new Promise(() => {}));
    const { result } = setup();
    act(() => {
      result.current.hero.toggle(FINALIZED);
      result.current.card.toggle(FINALIZED);
    });
    await waitFor(() => expect(mocks.action).toHaveBeenCalledTimes(1));
  });

  it("redireciona erro de sessão", async () => {
    mocks.redirect.mockReturnValue(true);
    mocks.action.mockResolvedValue({ success: false, error: "401" });
    const { result } = setup();
    act(() => result.current.hero.toggle(PENDING));
    await waitFor(() => expect(mocks.redirect).toHaveBeenCalledWith("401"));
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it.each(["403", "422", "rede"])(
    "recarrega evento, lista e painel após falha %s sem invalidar seleção",
    async (error) => {
      mocks.action.mockResolvedValue({ success: false, error });
      const { result, client } = setup();
      const detail = queryKeys.events.detail("e1");
      const selected = queryKeys.events.selected("circuit-1");
      const list = queryKeys.congregations.eventStatus("e1", "c1");
      client.setQueryData(detail, { status: EVENT_STATUSES.OPEN });
      client.setQueryData(selected, { id: "e1" });
      client.setQueryData(list, { status: PENDING });
      const invalidate = vi.spyOn(client, "invalidateQueries");

      act(() => result.current.hero.toggle(FINALIZED));

      await waitFor(() => expect(client.getQueryState(detail)?.isInvalidated).toBe(true));
      expect(client.getQueryState(list)?.isInvalidated).toBe(true);
      expect(client.getQueryState(selected)?.isInvalidated).toBe(false);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.all });
    },
  );

  it.each(["", "   "])("substitui erro vazio por mensagem legível", async (error) => {
    mocks.action.mockResolvedValue({ success: false, error });
    const { result } = setup();

    act(() => result.current.hero.toggle(FINALIZED));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Não foi possível atualizar a lista."));
  });

  it("converte rejeição de rede em erro e recarrega estado", async () => {
    mocks.action.mockRejectedValue(new Error("offline"));
    const { result, client } = setup();
    client.setQueryData(queryKeys.events.detail("e1"), { status: EVENT_STATUSES.OPEN });

    act(() => result.current.hero.toggle(FINALIZED));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Não foi possível atualizar a lista."));
    expect(client.getQueryState(queryKeys.events.detail("e1"))?.isInvalidated).toBe(true);
  });
});
