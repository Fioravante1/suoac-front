import { describe, expect, it } from "vitest";

import { enrollPassengerSchema, toEnrollPayload, type EnrollPassengerFormValues } from "./enroll-passenger-schema";

describe("enrollPassengerSchema", () => {
  it("aceita modo existente com passengerId válido", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita modo existente sem passengerId", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
    });

    expect(result.success).toBe(false);
  });

  it("aceita modo inline com nome e RG válidos", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "inline",
      name: "João Silva",
      rg: "12.345.678-X",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita modo inline com RG inválido", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "inline",
      name: "João Silva",
      rg: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("aceita campos opcionais", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      dayIds: ["660e8400-e29b-41d4-a716-446655440000"],
      observations: "Observação de teste",
      isExempt: true,
      exemptionReason: "Pioneiro regular",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita isenção sem motivo", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      isExempt: true,
      exemptionReason: "",
    });

    expect(result.success).toBe(false);
  });

  it("aceita inscrição com payment válido", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
    });

    expect(result.success).toBe(true);
  });

  it("aceita inscrição sem payment (retrocompatibilidade)", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita payment sem amount", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      includePayment: true,
      paymentPaidAt: "2026-01-15",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("paymentAmount");
    }
  });

  it("rejeita payment sem paidAt", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("paymentPaidAt");
    }
  });

  it("rejeita payment com data futura", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: futureDateStr,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("A data do pagamento não pode ser futura.");
    }
  });

  it("rejeita payment + isExempt simultâneos", () => {
    const result = enrollPassengerSchema.safeParse({
      mode: "existing",
      passengerId: "550e8400-e29b-41d4-a716-446655440000",
      includePayment: true,
      isExempt: true,
      exemptionReason: "Pioneiro",
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Passageiro isento não pode ter pagamento.");
    }
  });
});

describe("toEnrollPayload", () => {
  it("retorna passengerId para modo existente", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
    };

    expect(toEnrollPayload(values)).toEqual({ passengerId: "uuid-123" });
  });

  it("retorna nome, RG e telefone para modo inline", () => {
    const values: EnrollPassengerFormValues = {
      mode: "inline",
      name: "João",
      rg: "12345678X",
      phone: "11999999999",
    };

    expect(toEnrollPayload(values)).toEqual({
      name: "João",
      rg: "12345678X",
      phone: "11999999999",
    });
  });

  it("inclui dayIds quando presentes", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      dayIds: ["day-1", "day-2"],
    };

    expect(toEnrollPayload(values).dayIds).toEqual(["day-1", "day-2"]);
  });

  it("inclui exemptionReason somente quando isExempt é true", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      isExempt: true,
      exemptionReason: "Pioneiro",
    };

    expect(toEnrollPayload(values).exemptionReason).toBe("Pioneiro");
  });

  it("não inclui exemptionReason quando isExempt é false", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      isExempt: false,
      exemptionReason: "Pioneiro",
    };

    expect(toEnrollPayload(values).exemptionReason).toBeUndefined();
  });

  it("não inclui telefone vazio no modo inline", () => {
    const values: EnrollPassengerFormValues = {
      mode: "inline",
      name: "João",
      rg: "12345678X",
      phone: "",
    };

    expect(toEnrollPayload(values).phone).toBeUndefined();
  });

  it("inclui payment quando includePayment é true", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
    };

    const payload = toEnrollPayload(values);

    expect(payload.payment).toBeDefined();
    expect(payload.payment?.amount).toBe(75.0);
  });

  it("não inclui payment quando includePayment é false", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      includePayment: false,
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
    };

    expect(toEnrollPayload(values).payment).toBeUndefined();
  });

  it("converte paidAt para ISO string", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
    };

    const payload = toEnrollPayload(values);
    const expectedIso = new Date("2026-01-15").toISOString();

    expect(payload.payment?.paidAt).toBe(expectedIso);
  });

  it("inclui observations do payment quando presente", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
      paymentObservations: "Pagamento via Pix",
    };

    expect(toEnrollPayload(values).payment?.observations).toBe("Pagamento via Pix");
  });

  it("não inclui observations vazia no payment", () => {
    const values: EnrollPassengerFormValues = {
      mode: "existing",
      passengerId: "uuid-123",
      includePayment: true,
      paymentAmount: 75.0,
      paymentPaidAt: "2026-01-15",
      paymentObservations: "  ",
    };

    expect(toEnrollPayload(values).payment?.observations).toBeUndefined();
  });
});
