import { describe, expect, it } from "vitest";

import { updateEventSchema } from "./update-event-schema";

const baseValues = {
  title: "Assembleia SP 2026",
  ticketPrice: "25.00",
  registrationDeadline: "2026-06-01",
  paymentDeadline: "2026-06-15",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: "",
};

describe("updateEventSchema", () => {
  it("aceita dados válidos de edição", () => {
    const result = updateEventSchema.safeParse(baseValues);

    expect(result.success).toBe(true);
  });

  it("rejeita valor de passagem inválido", () => {
    const result = updateEventSchema.safeParse({ ...baseValues, ticketPrice: "25.999" });

    expect(result.success).toBe(false);
  });
});
