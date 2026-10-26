import { describe, expect, it } from "vitest";

import { PASSWORD_MAX_LENGTH } from "./password-policy";
import { newPasswordSchema } from "./password-schema";

describe("newPasswordSchema", () => {
  it("aceita senha que cumpre todos os requisitos", () => {
    expect(newPasswordSchema.safeParse("NovaSenha@123").success).toBe(true);
  });

  it("recusa senha curta", () => {
    const result = newPasswordSchema.safeParse("Abc123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("mínimo");
    }
  });

  it("recusa senha de 12 caracteres sem simbolo", () => {
    const result = newPasswordSchema.safeParse("NovaSenha1234");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("símbolo");
    }
  });

  it("recusa senha longa sem maiuscula nem numero", () => {
    const result = newPasswordSchema.safeParse("senhalongaaaa");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("maiúscula");
    }
  });

  it("recusa senha acima do teto do backend", () => {
    const result = newPasswordSchema.safeParse(`Aa1!${"x".repeat(PASSWORD_MAX_LENGTH)}`);

    expect(result.success).toBe(false);
  });
});
