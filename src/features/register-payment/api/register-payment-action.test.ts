import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerPaymentAction } from "./register-payment-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    payments: {
      create: (eventPassengerId: string) => `/event-passengers/${eventPassengerId}/payments`,
    },
  },
  httpClient: httpClientMock,
}));

const mockPayment = {
  id: "pay-1",
  amount: "50",
  paidAt: "2026-01-15T10:00:00.000Z",
  observations: "Pagamento via Pix",
  eventPassengerId: "ep-1",
  registeredById: "user-1",
  createdAt: "2026-01-15T12:30:00.000Z",
};

describe("registerPaymentAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(mockPayment);
  });

  it("chama o endpoint de criação de pagamento", async () => {
    const payload = { amount: 50, paidAt: "2026-01-15T10:00:00.000Z", observations: "Pagamento via Pix" };

    const result = await registerPaymentAction("ep-1", payload);

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/event-passengers/ep-1/payments", {
      method: "POST",
      body: payload,
    });
  });

  it("retorna dados do pagamento criado", async () => {
    const payload = { amount: 50, paidAt: "2026-01-15T10:00:00.000Z" };

    const result = await registerPaymentAction("ep-1", payload);

    expect(result).toEqual({ success: true, data: mockPayment });
  });

  it("retorna erro para eventPassengerId ausente", async () => {
    const payload = { amount: 50, paidAt: "2026-01-15T10:00:00.000Z" };

    const result = await registerPaymentAction("", payload);

    expect(result).toEqual({ success: false, error: "Inscrição inválida." });
  });

  it("retorna erro quando httpClient lança exceção", async () => {
    httpClientMock.mockRejectedValue(new Error("Valor excede o saldo restante de R$ 25.00"));

    const payload = { amount: 50, paidAt: "2026-01-15T10:00:00.000Z" };

    const result = await registerPaymentAction("ep-1", payload);

    expect(result).toEqual({ success: false, error: "Valor excede o saldo restante de R$ 25.00" });
  });

  it("retorna mensagem padrão para erro desconhecido", async () => {
    httpClientMock.mockRejectedValue("unknown error");

    const payload = { amount: 50, paidAt: "2026-01-15T10:00:00.000Z" };

    const result = await registerPaymentAction("ep-1", payload);

    expect(result).toEqual({ success: false, error: "Não foi possível registrar o pagamento." });
  });
});
