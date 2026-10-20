import { describe, expect, it } from "vitest";

import { formatPhone, isCompletePhone, phoneDigits } from "./phone";

describe("formatPhone", () => {
  it("deve formatar um celular completo", () => {
    expect(formatPhone("11977530630")).toBe("(11) 97753-0630");
  });

  it("deve formatar um fixo completo", () => {
    // O fixo quebra um dígito antes do celular, com os mesmos quatro no fim.
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it.each([
    ["", ""],
    ["1", "(1"],
    ["11", "(11"],
    ["119", "(11) 9"],
    ["119775", "(11) 9775"],
    ["1197753", "(11) 9775-3"],
    ["11977530", "(11) 9775-30"],
    ["1197753063", "(11) 9775-3063"],
    ["11977530630", "(11) 97753-0630"],
  ])("deve formatar %s enquanto digita", (input, expected) => {
    // A cada tecla o valor precisa ser exibível, não só quando o número fica
    // completo.
    expect(formatPhone(input)).toBe(expected);
  });

  it("deve descartar o que passa de onze dígitos", () => {
    // É o teto do formato: deixar entrar faria a máscara produzir algo que não
    // é telefone.
    expect(formatPhone("119775306309999")).toBe("(11) 97753-0630");
  });

  it("deve reformatar um valor que já tem máscara", () => {
    // O campo devolve o valor mascarado a cada tecla, então a função recebe de
    // volta o que ela mesma produziu.
    expect(formatPhone("(11) 97753-0630")).toBe("(11) 97753-0630");
  });

  it("deve ignorar letras e símbolos colados", () => {
    expect(formatPhone("tel: +55 (11) 97753-0630")).toBe("(55) 11977-5306");
  });

  it("deve permitir apagar até o fim", () => {
    // Apagar o último dígito não pode deixar a pontuação órfã para trás.
    expect(formatPhone("(1")).toBe("(1");
    expect(formatPhone("(")).toBe("");
  });
});

describe("phoneDigits", () => {
  it("deve devolver apenas os dígitos", () => {
    // É a forma que a API guarda: a máscara é só apresentação.
    expect(phoneDigits("(11) 97753-0630")).toBe("11977530630");
  });

  it("deve devolver vazio quando não há dígito", () => {
    expect(phoneDigits("(")).toBe("");
  });
});

describe("isCompletePhone", () => {
  it.each([
    ["(11) 97753-0630", true],
    ["(11) 3333-4444", true],
    ["(11) 9775-306", false],
    ["", false],
  ])("deve dizer se %s está completo", (value, expected) => {
    expect(isCompletePhone(value)).toBe(expected);
  });
});
