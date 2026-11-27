import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ httpClient: vi.fn() }));
vi.mock("@/shared/api/http-client", () => ({
  httpClient: mocks.httpClient,
  endpoints: { events: { updateStatus: (id: string) => `/events/${id}/status` } },
}));
import { publishEventAction } from "./publish-event-action";

describe("publishEventAction", () => {
  beforeEach(() => vi.clearAllMocks());
  it("publica via PATCH com status OPEN", async () => {
    const event = { id: "e1", status: "OPEN" };
    mocks.httpClient.mockResolvedValue(event);
    expect(await publishEventAction("e1")).toEqual({ success: true, data: event });
    expect(mocks.httpClient).toHaveBeenCalledWith("/events/e1/status", { method: "PATCH", body: { status: "OPEN" } });
  });

  it("recusa id vazio antes da chamada", async () => {
    expect(await publishEventAction("")).toEqual({ success: false, error: "Evento inválido." });
    expect(mocks.httpClient).not.toHaveBeenCalled();
  });

  it("preserva a mensagem de falha da API", async () => {
    mocks.httpClient.mockRejectedValue(new Error("Pelo menos um dia ativo"));
    expect(await publishEventAction("e1")).toEqual({ success: false, error: "Pelo menos um dia ativo" });
  });
});
