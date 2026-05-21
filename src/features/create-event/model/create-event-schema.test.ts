import { describe, expect, it } from "vitest";

import { createEventSchema } from "./create-event-schema";

const baseValues = {
  title: "Assembleia SP 2026",
  type: "ASSEMBLY",
  ticketPrice: "25.00",
  registrationDeadline: "2026-06-01",
  paymentDeadline: "2026-06-15",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  date: "2026-07-10",
  endDate: "",
  departureTime: "06:00",
  returnTime: "18:00",
  observations: "",
};

describe("createEventSchema", () => {
  it("aceita uma assembleia com um único dia", () => {
    const result = createEventSchema.safeParse(baseValues);

    expect(result.success).toBe(true);
  });

  it("exige data final para congresso regional", () => {
    const result = createEventSchema.safeParse({ ...baseValues, type: "REGIONAL_CONVENTION" });

    expect(result.success).toBe(false);
  });

  it("rejeita data final anterior à data inicial", () => {
    const result = createEventSchema.safeParse({
      ...baseValues,
      type: "REGIONAL_CONVENTION",
      endDate: "2026-07-09",
    });

    expect(result.success).toBe(false);
  });
});
