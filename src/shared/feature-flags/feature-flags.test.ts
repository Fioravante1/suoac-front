import { describe, expect, it } from "vitest";

import { buildRedesignFlagDescription } from "./feature-flags";

describe("descrição das flags de redesign", () => {
  it("diz a fatia, o propósito e o card que remove a flag", () => {
    // Quem abre o painel da Vercel meses depois precisa saber, sem recorrer ao
    // código, que a flag é temporária e quem a mata.
    expect(
      buildRedesignFlagDescription({
        description: "Serve a casca do evento redesenhada.",
        slice: "Fatia 2 — Shell",
        removalCard: "SUC-99",
      }),
    ).toBe("[Fatia 2 — Shell] Serve a casca do evento redesenhada. Temporária — remover em SUC-99.");
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
