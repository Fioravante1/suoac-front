import { describe, expect, it } from "vitest";

import { INVITATION_ERROR_CODES, INVITATION_ROLES, INVITATION_ROLE_LABELS, isInvitationRole } from "./invitation";

describe("isInvitationRole", () => {
  it.each(Object.values(INVITATION_ROLES))("reconhece %s como papel de convite", (role) => {
    expect(isInvitationRole(role)).toBe(true);
  });

  it.each(["CONGREGATION_ASSISTANT", "CIRCUIT_COORDINATOR", "CIRCUIT_ASSISTANT", "", "toString"])(
    "recusa %s",
    (role) => {
      // O assistente e promovido pelo coordenador, nunca convidado; convite nunca concede papel de circuito, e chave herdada do objeto
      // (`toString`) nao pode passar por papel.
      expect(isInvitationRole(role)).toBe(false);
    },
  );
});

describe("rótulos dos papéis", () => {
  it('seguem a nomenclatura do handoff: nunca "coordenador" sozinho, que também existe no corpo de anciãos', () => {
    for (const role of Object.values(INVITATION_ROLES)) {
      expect(INVITATION_ROLE_LABELS[role]).toBe("Coordenador do arranjo de ônibus na congregação");
    }
  });
});

describe("INVITATION_ERROR_CODES", () => {
  it("espelha os códigos que o backend devolve no corpo do erro", () => {
    expect(INVITATION_ERROR_CODES).toEqual({
      NOT_FOUND: "INVITATION_NOT_FOUND",
      EXPIRED: "INVITATION_EXPIRED",
      USED: "INVITATION_USED",
      REVOKED: "INVITATION_REVOKED",
      DECLINED: "INVITATION_DECLINED",
      NOT_EXPIRED: "INVITATION_NOT_EXPIRED",
      EMAIL_ALREADY_REGISTERED: "INVITATION_EMAIL_ALREADY_REGISTERED",
    });
  });
});
