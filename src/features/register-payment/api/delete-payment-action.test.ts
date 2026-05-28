import { beforeEach, describe, expect, it, vi } from "vitest";

import { deletePaymentAction } from "./delete-payment-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    payments: {
      delete: (id: string) => `/payments/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

describe("deletePaymentAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(undefined);
  });

  it("chama o endpoint de remoção do pagamento", async () => {
    const result = await deletePaymentAction("pay-1");

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/payments/pay-1", { method: "DELETE" });
  });

  it("retorna erro para paymentId ausente", async () => {
    const result = await deletePaymentAction("");

    expect(result).toEqual({ success: false, error: "Pagamento inválido." });
  });

  it("retorna erro quando httpClient lança exceção", async () => {
    httpClientMock.mockRejectedValue(new Error("Evento não está OPEN"));

    const result = await deletePaymentAction("pay-1");

    expect(result).toEqual({ success: false, error: "Evento não está OPEN" });
  });

  it("retorna mensagem padrão para erro desconhecido", async () => {
    httpClientMock.mockRejectedValue("unknown error");

    const result = await deletePaymentAction("pay-1");

    expect(result).toEqual({ success: false, error: "Não foi possível remover o pagamento." });
  });
});
