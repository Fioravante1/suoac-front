import { describe, expect, it } from "vitest";

import { updateEventDaySchema } from "./update-event-day-schema";

describe("updateEventDaySchema", () => {
  it("aceita horários válidos no formato HH:mm", () => {
    const result = updateEventDaySchema.safeParse({ departureTime: "06:00", returnTime: "18:30" });

    expect(result.success).toBe(true);
  });

  it("rejeita departureTime vazio", () => {
    const result = updateEventDaySchema.safeParse({ departureTime: "", returnTime: "18:00" });

    expect(result.success).toBe(false);
  });

  it("rejeita returnTime vazio", () => {
    const result = updateEventDaySchema.safeParse({ departureTime: "06:00", returnTime: "" });

    expect(result.success).toBe(false);
  });

  it("rejeita formato inválido sem dois dígitos", () => {
    const result = updateEventDaySchema.safeParse({ departureTime: "6:00", returnTime: "18:00" });

    expect(result.success).toBe(false);
  });

  it("rejeita formato com segundos", () => {
    const result = updateEventDaySchema.safeParse({ departureTime: "06:00:00", returnTime: "18:00" });

    expect(result.success).toBe(false);
  });

  it("rejeita texto livre", () => {
    const result = updateEventDaySchema.safeParse({ departureTime: "manhã", returnTime: "tarde" });

    expect(result.success).toBe(false);
  });
});
