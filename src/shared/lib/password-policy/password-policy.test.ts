import { describe, expect, it } from "vitest";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  countMetRequirements,
  isPasswordCompliant,
} from "./password-policy";

describe("politica de senha", () => {
  it("espelha o PASSWORD_COMPLEXITY_REGEX do backend", () => {
    // O backend valida a regex abaixo mais o minimo de 12 (SUC-79). Se este teste
    // cair, a tela passou a aceitar senha que a API recusa com 400.
    const backendRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\p{L}\p{N}\s])/u;
    const amostras = [
      "Senha-Segura1",
      "SenhaSegura123",
      "Senha Segura 1",
      "SenhaSeguraÇ1",
      "Ação-Segura1",
      "Senha€Segura1",
      "senha-segura1",
      "SENHA-SEGURA1",
      "Senha-Segura-x",
      "senhalongaaaa",
      "Abc12345!",
      "Ab1!",
    ];

    for (const amostra of amostras) {
      const aprovadoPeloBackend = backendRegex.test(amostra) && amostra.length >= PASSWORD_MIN_LENGTH;

      expect(isPasswordCompliant(amostra)).toBe(aprovadoPeloBackend);
    }
  });

  it("conta um requisito por regra cumprida", () => {
    expect(countMetRequirements("")).toBe(0);
    expect(countMetRequirements("abc")).toBe(1);
    expect(countMetRequirements("abcdefghijkl")).toBe(2);
    expect(countMetRequirements("Abcdefghijkl")).toBe(3);
    expect(countMetRequirements("Abcdefghijk1")).toBe(4);
    expect(countMetRequirements("Abcdefghij1!")).toBe(PASSWORD_REQUIREMENTS.length);
  });

  it("recusa senha mais longa que o teto do backend", () => {
    const longa = `Aa1!${"x".repeat(PASSWORD_MAX_LENGTH)}`;

    expect(countMetRequirements(longa)).toBe(PASSWORD_REQUIREMENTS.length);
    expect(isPasswordCompliant(longa)).toBe(false);
  });

  it("aceita exatamente no limite minimo", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(isPasswordCompliant("Abcdefghij1!")).toBe(true);
    expect(isPasswordCompliant("Abcdefghi1!")).toBe(false);
  });

  it("exige simbolo, e nao conta espaco nem letra acentuada como simbolo", () => {
    expect(isPasswordCompliant("Abcdefghij12")).toBe(false);
    expect(isPasswordCompliant("Abcdefg hij12")).toBe(false);
    expect(isPasswordCompliant("AbcdefghiçÇ12")).toBe(false);
    expect(isPasswordCompliant("Abcdefghij1-")).toBe(true);
    expect(isPasswordCompliant("Abcdefghij1€")).toBe(true);
  });
});
