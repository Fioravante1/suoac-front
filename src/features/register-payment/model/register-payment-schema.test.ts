import { describe, expect, it } from "vitest";

import {
  registerPaymentSchema,
  toCreatePaymentPayload,
  type RegisterPaymentFormValues,
} from "./register-payment-schema";

describe("registerPaymentSchema", () => {
  it("aceita valores válidos", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 50,
      paidAt: "2026-01-15",
    });

    expect(result.success).toBe(true);
  });

  it("aceita valor com centavos", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 25.5,
      paidAt: "2026-01-15",
    });

    expect(result.success).toBe(true);
  });

  it("aceita observações opcionais", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 10,
      paidAt: "2026-01-15",
      observations: "Pagamento via Pix",
    });

    expect(result.success).toBe(true);
  });

  it("aceita observações vazias", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 10,
      paidAt: "2026-01-15",
      observations: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita amount zero", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 0,
      paidAt: "2026-01-15",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita amount negativo", () => {
    const result = registerPaymentSchema.safeParse({
      amount: -10,
      paidAt: "2026-01-15",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita paidAt vazio", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 50,
      paidAt: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita data futura", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const result = registerPaymentSchema.safeParse({
      amount: 50,
      paidAt: futureDate.toISOString().split("T")[0],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita observações com mais de 500 caracteres", () => {
    const result = registerPaymentSchema.safeParse({
      amount: 50,
      paidAt: "2026-01-15",
      observations: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });
});

describe("toCreatePaymentPayload", () => {
  it("converte valores do formulário para payload de API", () => {
    const values: RegisterPaymentFormValues = {
      amount: 50,
      paidAt: "2026-01-15",
      observations: "Pix",
    };

    const payload = toCreatePaymentPayload(values);

    expect(payload.amount).toBe(50);
    expect(payload.paidAt).toBe(new Date("2026-01-15").toISOString());
    expect(payload.observations).toBe("Pix");
  });

  it("não inclui observations quando vazio", () => {
    const values: RegisterPaymentFormValues = {
      amount: 25,
      paidAt: "2026-01-15",
      observations: "",
    };

    const payload = toCreatePaymentPayload(values);

    expect(payload.observations).toBeUndefined();
  });

  it("não inclui observations quando undefined", () => {
    const values: RegisterPaymentFormValues = {
      amount: 25,
      paidAt: "2026-01-15",
    };

    const payload = toCreatePaymentPayload(values);

    expect(payload.observations).toBeUndefined();
  });

  it("faz trim em observations", () => {
    const values: RegisterPaymentFormValues = {
      amount: 25,
      paidAt: "2026-01-15",
      observations: "  Pix  ",
    };

    const payload = toCreatePaymentPayload(values);

    expect(payload.observations).toBe("Pix");
  });
});
