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
});
