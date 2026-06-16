import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "./change-password-schema";

const validData = {
  currentPassword: "80275@Suoac",
  newPassword: "NovaSenhaForte123",
  confirmPassword: "NovaSenhaForte123",
};

describe("changePasswordSchema", () => {
  it("aceita dados válidos", () => {
    expect(changePasswordSchema.safeParse(validData).success).toBe(true);
  });

  it("rejeita nova senha com menos de 8 caracteres", () => {
    const result = changePasswordSchema.safeParse({ ...validData, newPassword: "Abc123", confirmPassword: "Abc123" });

    expect(result.success).toBe(false);
  });

  it("rejeita quando a confirmação não coincide", () => {
    const result = changePasswordSchema.safeParse({ ...validData, confirmPassword: "OutraSenha123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejeita quando a nova senha é igual à atual", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "MesmaSenha123",
      newPassword: "MesmaSenha123",
      confirmPassword: "MesmaSenha123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("newPassword"))).toBe(true);
    }
  });
});
