import { describe, expect, it } from "vitest";

import { congregationEditWithoutEmailSchema, congregationFormSchema } from "./congregation-form-schema";

describe("congregationFormSchema", () => {
  it("aceita dados válidos com todos os campos", () => {
    const result = congregationFormSchema.safeParse({
      code: "123",
      name: "Cidade Popular",
      email: "teste@teste.com",
      city: "São Paulo",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita quando campos obrigatórios estão vazios", () => {
    const result = congregationFormSchema.safeParse({ code: "", name: "", email: "", city: "" });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toEqual(
        expect.arrayContaining([
          "Código é obrigatório.",
          "Nome é obrigatório.",
          "E-mail é obrigatório.",
          "E-mail inválido.",
          "Cidade é obrigatória.",
        ]),
      );
    }
  });

  it("rejeita quando dados não são informados", () => {
    const result = congregationFormSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("congregationEditWithoutEmailSchema", () => {
  const values = { code: "123", name: "Cidade Popular", city: "São Paulo" };

  it("aceita o e-mail vazio, para editar a congregação cadastrada sem e-mail", () => {
    expect(congregationEditWithoutEmailSchema.safeParse({ ...values, email: "" }).success).toBe(true);
  });

  it("continua recusando um e-mail inválido", () => {
    expect(congregationEditWithoutEmailSchema.safeParse({ ...values, email: "sem-arroba" }).success).toBe(false);
  });

  it("não afeta o cadastro novo, que continua exigindo o e-mail", () => {
    expect(congregationFormSchema.safeParse({ ...values, email: "" }).success).toBe(false);
  });
});
