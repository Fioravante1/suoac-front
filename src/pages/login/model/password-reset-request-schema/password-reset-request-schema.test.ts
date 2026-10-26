import { describe, expect, it } from "vitest";

import { passwordResetRequestSchema } from "./password-reset-request-schema";

describe("passwordResetRequestSchema", () => {
  it("aceita um e-mail válido", () => {
    expect(passwordResetRequestSchema.safeParse({ email: "coordenador@circuito.org" }).success).toBe(true);
  });

  it("rejeita texto que não é e-mail", () => {
    const result = passwordResetRequestSchema.safeParse({ email: "nao-e-email" });

    expect(result.success).toBe(false);

    if (result.success) return;

    expect(result.error.issues[0]?.message).toBe("Informe um e-mail válido.");
  });
});
