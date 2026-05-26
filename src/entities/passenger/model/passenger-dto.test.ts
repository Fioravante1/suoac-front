import { describe, expect, it } from "vitest";

import { normalizePassengerFormValues } from "./passenger-dto";

describe("normalizePassengerFormValues", () => {
  it("remove espaços e converte campos opcionais vazios em undefined", () => {
    expect(
      normalizePassengerFormValues({ name: " João ", rg: " 12.345.678-X ", phone: "", observations: " " }),
    ).toEqual({
      name: "João",
      rg: "12.345.678-X",
      phone: undefined,
      observations: undefined,
    });
  });

  it("preserva campos opcionais preenchidos", () => {
    expect(
      normalizePassengerFormValues({
        name: "Ana Santos",
        rg: "98765432Y",
        phone: "11999999999",
        observations: "Assento especial",
      }),
    ).toEqual({
      name: "Ana Santos",
      rg: "98765432Y",
      phone: "11999999999",
      observations: "Assento especial",
    });
  });
});
