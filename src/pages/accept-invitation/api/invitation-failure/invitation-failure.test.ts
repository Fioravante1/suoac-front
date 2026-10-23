import { describe, expect, it } from "vitest";

import { readInvitationFailure, rejectionOf } from "./invitation-failure";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const DETAILS = {
  email: "maria@example.com",
  invitedBy: "Marcos Oliveira",
  sentAt: "2026-10-14T12:00:00.000Z",
  expiresAt: "2026-10-21T12:00:00.000Z",
};

describe("readInvitationFailure", () => {
  it("lê o código do corpo do erro", async () => {
    const failure = await readInvitationFailure(jsonResponse(409, { statusCode: 409, code: "INVITATION_USED" }));

    expect(failure).toEqual({ code: "INVITATION_USED", details: null });
  });

  it("lê o contexto do convite expirado", async () => {
    const failure = await readInvitationFailure(jsonResponse(410, { code: "INVITATION_EXPIRED", invitation: DETAILS }));

    expect(failure.details).toEqual(DETAILS);
  });

  it("descarta contexto com campo faltando, em vez de mostrar tela pela metade", async () => {
    const failure = await readInvitationFailure(
      jsonResponse(410, { code: "INVITATION_EXPIRED", invitation: { email: "maria@example.com" } }),
    );

    expect(failure.details).toBeNull();
  });

  it("devolve falha sem código quando o corpo não é JSON", async () => {
    const failure = await readInvitationFailure(new Response("<html>Bad Gateway</html>", { status: 502 }));

    expect(failure).toEqual({ code: null, details: null });
  });

  it("devolve falha sem código quando o corpo não é um objeto", async () => {
    const failure = await readInvitationFailure(jsonResponse(500, "erro"));

    expect(failure.code).toBeNull();
  });
});

describe("rejectionOf", () => {
  it.each([
    ["INVITATION_NOT_FOUND", "not-found"],
    ["INVITATION_EXPIRED", "expired"],
    ["INVITATION_USED", "used"],
    ["INVITATION_REVOKED", "revoked"],
    ["INVITATION_EMAIL_ALREADY_REGISTERED", "email-registered"],
  ])("traduz %s para o estado %s", (code, state) => {
    expect(rejectionOf({ code, details: null })?.state).toBe(state);
  });

  it("leva o contexto só no convite expirado", () => {
    expect(rejectionOf({ code: "INVITATION_EXPIRED", details: DETAILS })?.details).toEqual(DETAILS);
    expect(rejectionOf({ code: "INVITATION_USED", details: DETAILS })?.details).toBeNull();
  });

  it("não inventa veredito sem código ou com código desconhecido", () => {
    expect(rejectionOf({ code: null, details: null })).toBeNull();
    expect(rejectionOf({ code: "OUTRA_COISA", details: null })).toBeNull();
  });

  it("não confunde o nome de uma propriedade herdada com um código", () => {
    expect(rejectionOf({ code: "toString", details: null })).toBeNull();
  });
});
