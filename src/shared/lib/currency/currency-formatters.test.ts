import { describe, expect, it } from "vitest";

import { formatCurrency, subtractCurrency } from "./currency-formatters";

describe("formatCurrency", () => {
  it("formata valor decimal como moeda brasileira", () => {
    expect(formatCurrency("75.00")).toBe("R$\u00a075,00");
  });

  it("formata valor zero", () => {
    expect(formatCurrency("0")).toBe("R$\u00a00,00");
  });

  it("formata valor numérico com centavos", () => {
    expect(formatCurrency(25.5)).toBe("R$\u00a025,50");
  });
});

describe("subtractCurrency", () => {
  it("subtrai valores monetários com precisão usando strings", () => {
    expect(subtractCurrency("75.00", "25.50")).toBe(49.5);
  });

  it("evita imprecisão de ponto flutuante", () => {
    // parseFloat("33.30") - parseFloat("33.20") daria 0.09999999999999787
    expect(subtractCurrency("33.30", "33.20")).toBe(0.1);
  });

  it("retorna zero para valores iguais", () => {
    expect(subtractCurrency("75.00", "75.00")).toBe(0);
  });

  it("retorna valor negativo quando b é maior que a", () => {
    expect(subtractCurrency("10.00", "25.00")).toBe(-15);
  });

  it("aceita números como entrada", () => {
    expect(subtractCurrency(100, 33.33)).toBe(66.67);
  });
});
