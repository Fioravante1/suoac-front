import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getGreetingByTime, pluralize } from "./string";

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

describe("getGreetingByTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 'Bom dia' de manha (antes das 12h)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 9, 0, 0));

    expect(getGreetingByTime()).toBe("Bom dia");
  });

  it("retorna 'Boa tarde' a tarde (12h-17h)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 14, 0, 0));

    expect(getGreetingByTime()).toBe("Boa tarde");
  });

  it("retorna 'Boa noite' a noite (18h+)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 20, 0, 0));

    expect(getGreetingByTime()).toBe("Boa noite");
  });

  it("retorna 'Bom dia' a meia-noite", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 0));

    expect(getGreetingByTime()).toBe("Bom dia");
  });

  it("retorna 'Boa tarde' ao meio-dia", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0));

    expect(getGreetingByTime()).toBe("Boa tarde");
  });
});
