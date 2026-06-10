import { describe, expect, it } from "vitest";

import { pluralize } from "./string";

describe("pluralize", () => {
  it("retorna singular quando count e 1", () => {
    expect(pluralize(1, "dia")).toBe("dia");
  });

  it("retorna plural quando count e 0", () => {
    expect(pluralize(0, "dia")).toBe("dias");
  });

  it("retorna plural quando count e maior que 1", () => {
    expect(pluralize(5, "passageiro")).toBe("passageiros");
  });

  it("retorna plural para numeros negativos", () => {
    expect(pluralize(-3, "dia")).toBe("dias");
  });
});
