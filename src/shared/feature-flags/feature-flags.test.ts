import { describe, expect, it } from "vitest";

import { buildRedesignFlagDescription, redesignLoginFlag } from "./feature-flags";

describe("descrição das flags de redesign", () => {
  it("diz a fatia, o propósito e o card que remove a flag", () => {
    // Quem abre o painel da Vercel meses depois precisa saber, sem recorrer ao
    // código, que a flag é temporária e quem a mata.
    expect(
      buildRedesignFlagDescription({
        description: "Serve a tela de login redesenhada.",
        slice: "Fatia 1 — Login",
        removalCard: "SUC-34",
      }),
    ).toBe("[Fatia 1 — Login] Serve a tela de login redesenhada. Temporária — remover em SUC-34.");
  });

  it("marca toda flag de redesign como temporária", () => {
    const description = buildRedesignFlagDescription({
      description: "Qualquer coisa.",
      slice: "Fatia 2 — Shell",
      removalCard: "SUC-99",
    });

    expect(description).toContain("Temporária");
    expect(description).toContain("SUC-99");
  });
});

describe("flag da tela de entrada redesenhada", () => {
  it("nasce desligada, para que falha de avaliação não exponha a tela nova", () => {
    // Fail-closed: sem chave do Vercel Flags, ou com o painel fora do ar, a rota
    // continua servindo a tela que está em produção.
    expect(redesignLoginFlag.defaultValue).toBe(false);
  });

  it("usa a chave prefixada e a descrição do padrão de governança", () => {
    expect(redesignLoginFlag.key).toBe("REDESIGN_LOGIN");
    expect(redesignLoginFlag.description).toBe(
      "[Fatia 1 — Login] Serve a tela de login redesenhada. Temporária — remover em SUC-34.",
    );
  });
});
