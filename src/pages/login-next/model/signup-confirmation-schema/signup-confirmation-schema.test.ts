import { describe, expect, it } from "vitest";

import {
  CIRCUIT_SIGNUP_CODE_LENGTH,
  CIRCUIT_SIGNUP_CODE_TTL_MINUTES,
  CIRCUIT_SIGNUP_RESEND_COOLDOWN_SECONDS,
  extractCodeDigits,
  formatResendCountdown,
  signupConfirmationSchema,
} from "./signup-confirmation-schema";

describe("signupConfirmationSchema", () => {
  it("deve aceitar e-mail válido e código de 6 dígitos numéricos", () => {
    const parsed = signupConfirmationSchema.safeParse({
      email: "joao@example.com",
      code: "123456",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ email: "joao@example.com", code: "123456" });
  });

  it.each(["", "12345", "1234567", "12345a", "abcdef"])("deve recusar código inválido '%s'", (code) => {
    const parsed = signupConfirmationSchema.safeParse({
      email: "joao@example.com",
      code,
    });

    expect(parsed.success).toBe(false);
  });

  it("deve recusar e-mail inválido", () => {
    const parsed = signupConfirmationSchema.safeParse({
      email: "invalido",
      code: "123456",
    });

    expect(parsed.success).toBe(false);
  });

  it("deve expor as constantes de tamanho, validade e espera do código", () => {
    expect(CIRCUIT_SIGNUP_CODE_LENGTH).toBe(6);
    expect(CIRCUIT_SIGNUP_CODE_TTL_MINUTES).toBe(30);
    expect(CIRCUIT_SIGNUP_RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});

describe("extractCodeDigits", () => {
  it("deve limpar caracteres não numéricos e limitar a 6 dígitos", () => {
    expect(extractCodeDigits(" 123-456-789 ")).toBe("123456");
    expect(extractCodeDigits("ab42c")).toBe("42");
    expect(extractCodeDigits("sem digitos")).toBe("");
  });
});

describe("formatResendCountdown", () => {
  it("deve formatar segundos em M:SS sem aceitar valores negativos", () => {
    expect(formatResendCountdown(60)).toBe("1:00");
    expect(formatResendCountdown(45)).toBe("0:45");
    expect(formatResendCountdown(9)).toBe("0:09");
    expect(formatResendCountdown(0)).toBe("0:00");
    expect(formatResendCountdown(-5)).toBe("0:00");
  });
});
