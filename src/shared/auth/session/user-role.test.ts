import { describe, expect, it } from "vitest";

import { USER_ROLE_LABELS, USER_ROLES } from "./user-role";

describe("USER_ROLES", () => {
  it("contem os 4 papeis esperados", () => {
    expect(Object.keys(USER_ROLES)).toHaveLength(4);
    expect(USER_ROLES.CIRCUIT_COORDINATOR).toBe("CIRCUIT_COORDINATOR");
    expect(USER_ROLES.CIRCUIT_ASSISTANT).toBe("CIRCUIT_ASSISTANT");
    expect(USER_ROLES.CONGREGATION_COORDINATOR).toBe("CONGREGATION_COORDINATOR");
    expect(USER_ROLES.CONGREGATION_ASSISTANT).toBe("CONGREGATION_ASSISTANT");
  });
});

describe("USER_ROLE_LABELS", () => {
  it("escreve o privilégio de cada papel por extenso", () => {
    expect(USER_ROLE_LABELS[USER_ROLES.CIRCUIT_COORDINATOR]).toBe("Coordenador do arranjo de ônibus no circuito");
    expect(USER_ROLE_LABELS[USER_ROLES.CIRCUIT_ASSISTANT]).toBe("Assistente do arranjo de ônibus no circuito");
    expect(USER_ROLE_LABELS[USER_ROLES.CONGREGATION_COORDINATOR]).toBe(
      "Coordenador do arranjo de ônibus na congregação",
    );
    expect(USER_ROLE_LABELS[USER_ROLES.CONGREGATION_ASSISTANT]).toBe("Assistente do arranjo de ônibus na congregação");
  });

  it("nunca deixa o privilégio sem dizer de qual arranjo se trata", () => {
    for (const label of Object.values(USER_ROLE_LABELS)) {
      expect(label).toMatch(/ do arranjo de ônibus (no circuito|na congregação)$/);
    }
  });
});
