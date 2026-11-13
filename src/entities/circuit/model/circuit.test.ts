import { describe, expect, it } from "vitest";

import { formatCircuitLocation, formatCircuitName } from "./circuit";

describe("formatCircuitName", () => {
  it("antepõe a palavra Circuito ao identificador", () => {
    expect(formatCircuitName({ name: "SP-17" })).toBe("Circuito SP-17");
  });

  it("mantém o identificador como a API o devolve, inclusive com espaço", () => {
    expect(formatCircuitName({ name: "SP-019 A" })).toBe("Circuito SP-019 A");
  });
});

describe("formatCircuitLocation", () => {
  it("junta a cidade e a UF com vírgula", () => {
    expect(formatCircuitLocation({ city: "Campinas", state: "SP" })).toBe("Campinas, SP");
  });
});
