import { describe, expect, it } from "vitest";

import { isSignupFieldPath, readSignupConflicts, resolveSignupFieldStep } from "./signup-field";

describe("isSignupFieldPath", () => {
  it.each(["coordinator.email", "circuit.name", "congregations.0.code", "congregations.12.name"])(
    "deve reconhecer %s como campo do formulário",
    (field) => {
      expect(isSignupFieldPath(field)).toBe(true);
    },
  );

  it.each(["congregations", "congregations.code", "congregations.x.code", "coordinator", "outro.campo", ""])(
    "não deve reconhecer '%s' como campo do formulário",
    (field) => {
      expect(isSignupFieldPath(field)).toBe(false);
    },
  );
});

describe("resolveSignupFieldStep", () => {
  it("deve apontar a etapa de cada grupo de campos", () => {
    expect(resolveSignupFieldStep("coordinator.email")).toBe(0);
    expect(resolveSignupFieldStep("circuit.name")).toBe(1);
    expect(resolveSignupFieldStep("congregations.2.code")).toBe(2);
  });

  it("deve devolver null para caminho que não é de campo", () => {
    expect(resolveSignupFieldStep("congregations")).toBeNull();
  });
});

describe("readSignupConflicts", () => {
  it("deve priorizar a lista fields quando presente e filtrar itens inválidos", () => {
    expect(
      readSignupConflicts({
        field: "coordinator.email",
        message: "Este e-mail ja esta cadastrado",
        fields: [
          null,
          { field: 123 },
          { field: "coordinator.email", message: "Este e-mail ja esta cadastrado" },
          { field: "circuit.name", message: "Este circuito ja esta em uso" },
        ],
      }),
    ).toEqual([
      { field: "coordinator.email", message: "Este e-mail ja esta cadastrado" },
      { field: "circuit.name", message: "Este circuito ja esta em uso" },
    ]);
  });

  it("deve usar field e message quando fields não é uma lista", () => {
    expect(readSignupConflicts({ field: "congregations", message: "Código já em uso" })).toEqual([
      { field: "congregations", message: "Código já em uso" },
    ]);
  });

  it("deve devolver lista vazia quando o corpo não aponta conflito de campo", () => {
    expect(readSignupConflicts(null)).toEqual([]);
    expect(readSignupConflicts({ message: "Cadastro ja confirmado" })).toEqual([]);
  });
});
