import { describe, expect, it } from "vitest";

import { formatCurrency } from "./currency-formatters";

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
