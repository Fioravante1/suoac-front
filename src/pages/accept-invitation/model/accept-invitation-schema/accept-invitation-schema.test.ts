import { describe, expect, it } from "vitest";

import { acceptInvitationPayloadSchema, acceptInvitationSchema } from "./accept-invitation-schema";

const VALID = {
  name: "Maria Souza",
  phone: "(19) 99654-3210",
  password: "Senha@Segura123",
  confirmPassword: "Senha@Segura123",
  terms: true,
};

function messagesOf(values: Record<string, unknown>): string[] {
  const result = acceptInvitationSchema.safeParse(values);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("acceptInvitationSchema", () => {
  it("aceita nome, celular com máscara, senha forte, confirmação e termos", () => {
    expect(acceptInvitationSchema.safeParse(VALID).success).toBe(true);
  });

  it("exige nome e sobrenome", () => {
    expect(messagesOf({ ...VALID, name: "Maria" })).toContain("Informe nome e sobrenome.");
  });

  it("não aceita nome em branco", () => {
    expect(messagesOf({ ...VALID, name: "   " })).toContain("Informe seu nome completo.");
  });

  it("recusa celular sem o número completo", () => {
    expect(messagesOf({ ...VALID, phone: "(19) 9965" })).toContain("Informe o DDD e o número completo.");
  });

  it("aceita fixo de dez dígitos, como o autocadastro", () => {
    expect(acceptInvitationSchema.safeParse({ ...VALID, phone: "(19) 3333-4444" }).success).toBe(true);
  });

  it("recusa celular com mais de onze dígitos", () => {
    expect(messagesOf({ ...VALID, phone: "199965432101" })).toContain("O celular tem no máximo 11 dígitos.");
  });

  it("recusa senha que não cumpre a política", () => {
    expect(acceptInvitationSchema.safeParse({ ...VALID, password: "fraca", confirmPassword: "fraca" }).success).toBe(
      false,
    );
  });

  it("recusa confirmação diferente da senha, apontando o campo de confirmação", () => {
    const result = acceptInvitationSchema.safeParse({ ...VALID, confirmPassword: "Outra@1234" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.message === "As senhas não coincidem.")?.path).toEqual([
      "confirmPassword",
    ]);
  });

  it("exige o aceite dos termos", () => {
    expect(messagesOf({ ...VALID, terms: false })).toContain("Aceite os termos para continuar.");
  });
});

describe("acceptInvitationPayloadSchema", () => {
  const PAYLOAD = { ...VALID, acceptedTerms: true };

  it("valida o que o back exige e descarta a confirmação, mantendo o aceite", () => {
    const result = acceptInvitationPayloadSchema.safeParse(PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Maria Souza",
      phone: "(19) 99654-3210",
      password: "Senha@Segura123",
      acceptedTerms: true,
    });
  });

  it("recusa o envio sem o aceite dos termos", () => {
    expect(acceptInvitationPayloadSchema.safeParse({ ...PAYLOAD, acceptedTerms: false }).success).toBe(false);
    expect(acceptInvitationPayloadSchema.safeParse(VALID).success).toBe(false);
  });

  it("apara o nome antes de enviar", () => {
    const result = acceptInvitationPayloadSchema.safeParse({ ...PAYLOAD, name: "  Maria Souza  " });

    expect(result.data?.name).toBe("Maria Souza");
  });
});
