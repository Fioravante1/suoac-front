import { describe, expect, it } from "vitest";

import { formatPhone, formatPhoneInput, isCompletePhone, phoneDigits } from "./phone";

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
    expect(formatPhone("tel: (11) 97753-0630")).toBe("(11) 97753-0630");
  });

  it.each([
    ["+55 (11) 97753-0630", "(11) 97753-0630"],
    ["5511977530630", "(11) 97753-0630"],
    ["551133334444", "(11) 3333-4444"],
  ])("deve descartar o código do país em %s", (input, expected) => {
    // Número copiado do WhatsApp vem com `+55`. Mantê-lo faria o corte em onze
    // dígitos produzir `(55) 11977-5306` — outro telefone, válido na aparência
    // e gravado sem ninguém perceber.
    expect(formatPhone(input)).toBe(expected);
  });

  it("não deve confundir o DDD 55 com código do país", () => {
    // Santa Maria é DDD 55: com onze dígitos, o `55` da frente é área, não país.
    expect(formatPhone("55977530630")).toBe("(55) 97753-0630");
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

describe("formatPhoneInput", () => {
  it.each([
    ["11977530630", 11, "(11) 97753-0630", 15],
    ["(11) 97753-0630", 7, "(11) 97753-0630", 7],
    ["(11) 9753-0630", 7, "(11) 9753-0630", 7],
    ["(11) 9773-0630", 8, "(11) 9773-0630", 8],
    ["(1) 97753-0630", 2, "(19) 7753-0630", 2],
    ["(", 1, "", 0],
  ])("mantém o cursor ao formatar %s na posição %i", (value, caret, expectedValue, expectedCaret) => {
    expect(formatPhoneInput(value, caret)).toEqual({ value: expectedValue, caret: expectedCaret });
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
