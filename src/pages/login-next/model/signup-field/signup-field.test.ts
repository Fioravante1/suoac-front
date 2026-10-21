import { describe, expect, it } from "vitest";

import { isSignupFieldPath, resolveSignupFieldStep } from "./signup-field";

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
