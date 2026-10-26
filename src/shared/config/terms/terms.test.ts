import { describe, expect, it } from "vitest";

import { TERMS_VERSION, formatTermsDate } from "./terms";

describe("versão dos termos", () => {
  it("tem o formato AAAA-MM-DD que a API exige", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("é uma data que existe", () => {
    const date = new Date(`${TERMS_VERSION}T00:00:00Z`);

    expect(date.toISOString().startsWith(TERMS_VERSION)).toBe(true);
  });

  it("escreve a data por extenso, como a página a exibe", () => {
    expect(formatTermsDate("2026-10-25")).toBe("25 de outubro de 2026");
  });

  it("não recua o dia em fuso a oeste de Greenwich", () => {
    expect(formatTermsDate("2026-01-01")).toBe("1 de janeiro de 2026");
  });
});
