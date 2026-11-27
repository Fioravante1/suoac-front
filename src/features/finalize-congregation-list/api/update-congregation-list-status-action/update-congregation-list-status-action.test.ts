import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONGREGATION_LIST_STATUSES } from "@/entities/congregation";

import { updateCongregationListStatusAction } from "./update-congregation-list-status-action";

const http = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api/http-client", async (original) => ({
  ...(await original<typeof import("@/shared/api/http-client")>()),
  httpClient: http,
}));

const { PENDING, FINALIZED } = CONGREGATION_LIST_STATUSES;

describe("atualizar lista", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa PATCH com o status e os identificadores", async () => {
    http.mockResolvedValue({ status: FINALIZED });
    expect(await updateCongregationListStatusAction("e1", "c1", FINALIZED)).toEqual({
      success: true,
      data: { status: FINALIZED },
    });
    expect(http).toHaveBeenCalledWith("/events/e1/congregation-statuses/c1", {
      method: "PATCH",
      body: { status: FINALIZED },
    });
  });

  it("preserva a mensagem de erro e rejeita identificadores vazios", async () => {
    http.mockRejectedValue(new Error("Sem permissão"));
    expect(await updateCongregationListStatusAction("e1", "c1", PENDING)).toEqual({
      success: false,
      error: "Sem permissão",
    });
    http.mockClear();
    expect((await updateCongregationListStatusAction("", "c1", PENDING)).success).toBe(false);
    expect(http).not.toHaveBeenCalled();
  });
});
