import { describe, expect, it } from "vitest";

import { formatPassengerObservations, formatPassengerPhone } from "./passenger";

describe("formatPassengerPhone", () => {
  it("retorna fallback para null", () => {
    expect(formatPassengerPhone(null)).toBe("Sem telefone");
  });

  it("retorna fallback para string vazia", () => {
    expect(formatPassengerPhone("")).toBe("Sem telefone");
  });

  it("retorna fallback para string de espaços", () => {
    expect(formatPassengerPhone("   ")).toBe("Sem telefone");
  });

  it("retorna telefone quando preenchido", () => {
    expect(formatPassengerPhone("11999999999")).toBe("11999999999");
  });
});

describe("formatPassengerObservations", () => {
  it("retorna fallback para null", () => {
    expect(formatPassengerObservations(null)).toBe("Sem observações");
  });

  it("retorna fallback para string vazia", () => {
    expect(formatPassengerObservations("")).toBe("Sem observações");
  });

  it("retorna fallback para string de espaços", () => {
    expect(formatPassengerObservations("   ")).toBe("Sem observações");
  });

  it("retorna observação quando preenchida", () => {
    expect(formatPassengerObservations("Assento especial")).toBe("Assento especial");
  });
});
