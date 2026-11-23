import { describe, expect, it } from "vitest";

import { calcPercentage, formatInteger } from "./number";

describe("calcPercentage", () => {
  it("calcula percentual arredondado", () => {
    expect(calcPercentage(25, 40)).toBe(63);
  });

  it("retorna 100 quando valor igual ao total", () => {
    expect(calcPercentage(50, 50)).toBe(100);
  });

  it("retorna 0 quando valor e zero", () => {
    expect(calcPercentage(0, 100)).toBe(0);
  });

  it("retorna 0 quando total e zero", () => {
    expect(calcPercentage(10, 0)).toBe(0);
  });
});

describe("formatInteger", () => {
  it("separa o milhar com ponto, como em pt-BR", () => {
    expect(formatInteger(1204)).toBe("1.204");
  });

  it("escreve o zero", () => {
    expect(formatInteger(0)).toBe("0");
  });
});
