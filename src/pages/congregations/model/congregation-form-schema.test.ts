import { describe, expect, it } from "vitest";

import { congregationFormSchema } from "./congregation-form-schema";

describe("congregationFormSchema", () => {
  it("aceita dados válidos com nome e cidade", () => {
    const result = congregationFormSchema.safeParse({ name: "Cidade Popular", city: "São Paulo" });

    expect(result.success).toBe(true);
  });

  it("aceita dados válidos sem cidade", () => {
    const result = congregationFormSchema.safeParse({ name: "Cidade Popular" });

    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = congregationFormSchema.safeParse({ name: "" });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nome é obrigatório.");
    }
  });

  it("rejeita quando nome não é informado", () => {
    const result = congregationFormSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
