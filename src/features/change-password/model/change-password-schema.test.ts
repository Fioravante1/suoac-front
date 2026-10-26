import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "./change-password-schema";

const validData = {
  currentPassword: "80275@Suoac",
  newPassword: "NovaSenha@Forte123",
  confirmPassword: "NovaSenha@Forte123",
};

describe("changePasswordSchema", () => {
  it("aceita dados válidos", () => {
    expect(changePasswordSchema.safeParse(validData).success).toBe(true);
  });

  it("rejeita nova senha com menos de 12 caracteres", () => {
    const result = changePasswordSchema.safeParse({ ...validData, newPassword: "Abc123", confirmPassword: "Abc123" });

    expect(result.success).toBe(false);
  });

  it("rejeita senha longa sem maiúscula e sem número", () => {
    /*
     * O defeito do SUC-59: `senhalonga` cumpre o minimo de caracteres e passava
     * pela validacao do cliente, mas o `PASSWORD_COMPLEXITY_REGEX` do backend
     * recusa — a pessoa levava `400` depois de digitar a senha duas vezes.
     */
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "senhalonga",
      confirmPassword: "senhalonga",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("newPassword"))).toBe(true);
    }
  });

  it("aceita a senha mínima que o servidor aprova", () => {
    // Contraprova do caso acima: a correcao nao pode ter apertado demais.
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "NovaSenha@123",
      confirmPassword: "NovaSenha@123",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita senha acima do teto aceito pela API", () => {
    const longa = `A1${"a".repeat(99)}`;
    const result = changePasswordSchema.safeParse({ ...validData, newPassword: longa, confirmPassword: longa });

    expect(result.success).toBe(false);
  });

  it("rejeita quando a confirmação não coincide", () => {
    const result = changePasswordSchema.safeParse({ ...validData, confirmPassword: "OutraSenha@123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejeita quando a nova senha é igual à atual", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "MesmaSenha@123",
      newPassword: "MesmaSenha@123",
      confirmPassword: "MesmaSenha@123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("newPassword"))).toBe(true);
    }
  });
});
