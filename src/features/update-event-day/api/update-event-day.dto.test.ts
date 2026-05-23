import { describe, expect, it } from "vitest";

import { mapUpdateEventDayFormToDto } from "./update-event-day.dto";

describe("mapUpdateEventDayFormToDto", () => {
  const original = { departureTime: "06:00", returnTime: "18:00" };

  it("retorna objeto vazio quando nenhum campo mudou", () => {
    const dto = mapUpdateEventDayFormToDto({ departureTime: "06:00", returnTime: "18:00" }, original);

    expect(dto).toEqual({});
  });

  it("inclui apenas departureTime quando só ele mudou", () => {
    const dto = mapUpdateEventDayFormToDto({ departureTime: "07:00", returnTime: "18:00" }, original);

    expect(dto).toEqual({ departureTime: "07:00" });
  });

  it("inclui apenas returnTime quando só ele mudou", () => {
    const dto = mapUpdateEventDayFormToDto({ departureTime: "06:00", returnTime: "20:00" }, original);

    expect(dto).toEqual({ returnTime: "20:00" });
  });

  it("inclui ambos os campos quando ambos mudaram", () => {
    const dto = mapUpdateEventDayFormToDto({ departureTime: "07:00", returnTime: "20:00" }, original);

    expect(dto).toEqual({ departureTime: "07:00", returnTime: "20:00" });
  });
});
