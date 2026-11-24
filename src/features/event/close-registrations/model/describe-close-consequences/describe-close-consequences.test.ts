import { describe, expect, it } from "vitest";

import { EVENT_DAY_STATUSES, type EventDayInEvent } from "@/entities/event";

import { describeCloseConsequences } from "./describe-close-consequences";

function day(date: string): EventDayInEvent {
  return {
    id: `day-${date}`,
    dayNumber: 1,
    date: `${date}T00:00:00.000Z`,
    label: "",
    departureTime: "06:30",
    returnTime: "18:30",
    status: EVENT_DAY_STATUSES.ACTIVE,
    eventId: "event-1",
  };
}

// "Inscrições até 12/10/2026", uma segunda-feira, e o evento de 23 a 25/10.
const event = { registrationDeadline: "2026-10-13T02:59:59.999Z", days: [day("2026-10-23"), day("2026-10-25")] };

describe("describeCloseConsequences", () => {
  it("antes do prazo, traz o texto do v3 e o curto do celular, os dois dizendo que dá para reabrir", () => {
    expect(describeCloseConsequences(event, "2026-10-07")).toEqual({
      full: "O prazo vai até segunda, 12/10. Depois de encerrar, as congregações não poderão cadastrar nem alterar passageiros. Você pode reabrir depois.",
      compact: "As congregações não poderão mais adicionar passageiros. Você pode reabrir depois.",
    });
  });

  it("com o prazo vencido, avisa que não haverá volta, porque a API recusa reabrir", () => {
    const consequences = describeCloseConsequences(event, "2026-10-13");

    expect(consequences.full).toBe(
      "O prazo venceu em 12/10. Depois de encerrar, as congregações não poderão cadastrar nem alterar passageiros. Não será possível reabrir depois.",
    );
    expect(consequences.compact).toBe(
      "As congregações não poderão mais adicionar passageiros. Não será possível reabrir depois.",
    );
  });

  it("com o evento terminado, também avisa que não haverá volta, mesmo com o prazo posto depois", () => {
    const lateDeadline = { ...event, registrationDeadline: "2026-10-31T02:59:59.999Z" };

    expect(describeCloseConsequences(lateDeadline, "2026-10-26").compact).toMatch(/Não será possível reabrir/);
  });
});
