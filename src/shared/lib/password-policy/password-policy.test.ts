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
    // O backend valida /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ mais o minimo de 8. Se
    // este teste cair, a tela passou a aceitar senha que a API recusa com 400.
    const backendRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    const amostras = ["Senha123", "senhalonga", "SENHALONGA", "Abc12345", "12345678", "Ab1"];

    for (const amostra of amostras) {
      const aprovadoPeloBackend = backendRegex.test(amostra) && amostra.length >= PASSWORD_MIN_LENGTH;

      expect(isPasswordCompliant(amostra)).toBe(aprovadoPeloBackend);
    }
  });

  it("conta um requisito por regra cumprida", () => {
    expect(countMetRequirements("")).toBe(0);
    expect(countMetRequirements("abc")).toBe(1);
    expect(countMetRequirements("abcdefgh")).toBe(2);
    expect(countMetRequirements("Abcdefgh")).toBe(3);
    expect(countMetRequirements("Abcdefg1")).toBe(PASSWORD_REQUIREMENTS.length);
  });

  it("recusa senha mais longa que o teto do backend", () => {
    const longa = `Aa1${"x".repeat(PASSWORD_MAX_LENGTH)}`;

    expect(countMetRequirements(longa)).toBe(PASSWORD_REQUIREMENTS.length);
    expect(isPasswordCompliant(longa)).toBe(false);
  });

  it("aceita exatamente no limite minimo", () => {
    expect(isPasswordCompliant("Abcdefg1")).toBe(true);
    expect(isPasswordCompliant("Abcdef1")).toBe(false);
  });
});
