import { describe, expect, it } from "vitest";

import { passengerFormSchema } from "./passenger-form-schema";

describe("passengerFormSchema", () => {
  it("aceita dados válidos de passageiro", () => {
    const result = passengerFormSchema.safeParse({
      name: "João Silva",
      rg: "12.345.678-X",
      phone: "11999999999",
      observations: "Necessita de assento especial",
    });

    expect(result.success).toBe(true);
  });

  it("aceita campos opcionais ausentes", () => {
    const result = passengerFormSchema.safeParse({
      name: "João Silva",
      rg: "12345678X",
    });

    expect(result.success).toBe(true);
  });

  it("aceita campos opcionais vazios", () => {
    const result = passengerFormSchema.safeParse({
      name: "João Silva",
      rg: "12345678X",
      phone: "",
      observations: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita nome curto demais", () => {
    const result = passengerFormSchema.safeParse({
      name: "J",
      rg: "12345678X",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita RG fora do formato permitido", () => {
    const result = passengerFormSchema.safeParse({
      name: "João Silva",
      rg: "ABC123",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita telefone com menos de 8 caracteres", () => {
    const result = passengerFormSchema.safeParse({
      name: "João Silva",
      rg: "12345678X",
      phone: "1234567",
    });

    expect(result.success).toBe(false);
  });
});
