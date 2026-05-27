import { describe, expect, it } from "vitest";

import { updateEventPassengerDaysSchema } from "./update-event-passenger-days-schema";

describe("updateEventPassengerDaysSchema", () => {
  it("aceita ao menos um dia selecionado", () => {
    const result = updateEventPassengerDaysSchema.safeParse({ dayIds: ["day-1"] });

    expect(result.success).toBe(true);
  });

  it("rejeita envio sem dias selecionados", () => {
    const result = updateEventPassengerDaysSchema.safeParse({ dayIds: [] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Selecione pelo menos um dia.");
  });
});
