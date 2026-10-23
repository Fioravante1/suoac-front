import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getFirstName, getInitials, getGreetingByTime, pluralize } from "./string";

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

describe("getInitials", () => {
  it("retorna iniciais do primeiro e ultimo nome", () => {
    expect(getInitials("Maria Silva")).toBe("MS");
  });

  it("retorna inicial unica para nome simples", () => {
    expect(getInitials("Joao")).toBe("J");
  });

  it("retorna iniciais do primeiro e ultimo em nome composto", () => {
    expect(getInitials("Ana Paula de Souza")).toBe("AS");
  });

  it("retorna '?' para string vazia", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
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

describe("getFirstName", () => {
  it("devolve o primeiro nome de um nome completo", () => {
    expect(getFirstName("Marcos Oliveira")).toBe("Marcos");
  });

  it("ignora espaços nas pontas e repetidos", () => {
    expect(getFirstName("  Ana   Beatriz Souza ")).toBe("Ana");
  });

  it("devolve o próprio nome quando há só um", () => {
    expect(getFirstName("Rafael")).toBe("Rafael");
  });

  it("devolve vazio para nome em branco", () => {
    expect(getFirstName("   ")).toBe("");
  });
});
