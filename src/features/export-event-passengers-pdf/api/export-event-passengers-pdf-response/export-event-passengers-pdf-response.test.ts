import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/shared/api/http-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/http-client")>();
  return { ...actual, httpClientRaw: vi.fn() };
});

import { httpClientRaw, HttpError } from "@/shared/api/http-client";
import { getSession } from "@/shared/auth/session";

import { exportEventPassengersPdfResponse } from "./export-event-passengers-pdf-response";

const getSessionMock = vi.mocked(getSession);
const httpClientRawMock = vi.mocked(httpClientRaw);

const session = {
  id: "u-1",
  name: "Coord",
  email: "c@test.com",
  role: "CIRCUIT_COORDINATOR" as const,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

describe("exportEventPassengersPdfResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue(session);
  });

  it("retorna 401 quando não há sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const res = await exportEventPassengersPdfResponse({ eventId: "evt-1" });

    expect(res.status).toBe(401);
    expect(httpClientRawMock).not.toHaveBeenCalled();
  });

  it("monta endpoint com circuitId da sessão e query (congregationId + variant)", async () => {
    httpClientRawMock.mockResolvedValue(new Response("ok", { status: 200 }));

    await exportEventPassengersPdfResponse({
      eventId: "evt-1",
      congregationId: "cong-9",
      variant: "carrier",
    });

    expect(httpClientRawMock).toHaveBeenCalledWith(
      "/circuits/circuit-1/events/evt-1/passengers/export.pdf?congregationId=cong-9&variant=carrier",
    );
  });

  it("repassa o binário e os headers em caso de sucesso", async () => {
    httpClientRawMock.mockResolvedValue(
      new Response(new Blob(["%PDF"]), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="inscritos-evt-1.pdf"',
        },
      }),
    );

    const res = await exportEventPassengersPdfResponse({ eventId: "evt-1" });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="inscritos-evt-1.pdf"');
  });

  it("normaliza erro JSON do backend preservando o status", async () => {
    httpClientRawMock.mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 422, message: "O evento possui 3000 inscritos." }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await exportEventPassengersPdfResponse({ eventId: "evt-1" });
    const body = (await res.json()) as { statusCode: number; message: string };

    expect(res.status).toBe(422);
    expect(body.message).toBe("O evento possui 3000 inscritos.");
  });

  it("normaliza erro com corpo vazio/não-JSON para JSON com fallback", async () => {
    httpClientRawMock.mockResolvedValue(new Response("", { status: 500 }));

    const res = await exportEventPassengersPdfResponse({ eventId: "evt-1" });
    const body = (await res.json()) as { statusCode: number; message: string };

    expect(res.status).toBe(500);
    expect(body.message).toBe("Não foi possível exportar o PDF.");
  });

  it("traduz HttpError (sessão expirada) em JSON preservando o status", async () => {
    httpClientRawMock.mockRejectedValue(new HttpError(401, "Sessão expirada. Faça login novamente."));

    const res = await exportEventPassengersPdfResponse({ eventId: "evt-1" });
    const body = (await res.json()) as { statusCode: number; message: string };

    expect(res.status).toBe(401);
    expect(body.message).toBe("Sessão expirada. Faça login novamente.");
  });
});
