import { describe, expect, it } from "vitest";

import { EVENT_TYPES, EVENT_STATUSES, EVENT_DAY_STATUSES, type Event } from "@/entities/event";

import { buildDraftChecklist, getDraftEventDescription } from "./draft-checklist";

function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Assembleia",
    type: EVENT_TYPES.ASSEMBLY,
    status: EVENT_STATUSES.DRAFT,
    ticketPrice: "40",
    venue: "Salão",
    address: "Rua A",
    city: "Campinas",
    state: "SP",
    registrationDeadline: "2026-10-13T02:59:59.999Z",
    paymentDeadline: "2026-10-20T02:59:59.999Z",
    circuitId: "circuit-1",
    createdById: "user-1",
    observations: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        date: "2026-11-14T00:00:00Z",
        departureTime: "06:30",
        returnTime: "18:30",
        status: EVENT_DAY_STATUSES.ACTIVE,
        label: "",
        eventId: "event-1",
      },
    ],
    ...overrides,
  };
}

describe("buildDraftChecklist", () => {
  it("conta quatro itens prontos, sem inventar ônibus", () => {
    const result = buildDraftChecklist(buildEvent(), 20);
    expect(result.readyCount).toBe(4);
    expect(result.percent).toBe(80);
    expect(result.items.map((item) => item.id)).toEqual(["identity", "dates", "pricing", "buses", "congregations"]);
    expect(result.items[3]).toMatchObject({ isDone: false, action: { kind: "coming-soon" } });
  });

  it("reconhece dados obrigatórios ausentes e nenhum dia ativo", () => {
    const event = buildEvent({ title: " ", ticketPrice: "0", registrationDeadline: "invalid", days: [] });
    const result = buildDraftChecklist(event, 0);
    expect(result.readyCount).toBe(0);
    expect(result.items[1]?.subtitle).toBe("Nenhum dia ativo");
    expect(result.items[4]?.subtitle).toBe("Nenhuma congregação ativa");
  });

  it("lê o prazo no dia correto em São Paulo e mostra os horários de um dia", () => {
    const result = buildDraftChecklist(buildEvent());
    expect(result.items[2]?.subtitle).toContain("inscrições até 12/10");
    expect(result.items[1]?.subtitle).toContain("saída 06:30, retorno 18:30");
    expect(result.items[4]).toMatchObject({ isDone: false, subtitle: "Todas participam" });
  });

  it("usa Datas com vários dias e ignora dias cancelados", () => {
    const event = buildEvent();
    const first = event.days![0]!;
    event.days = [
      first,
      { ...first, id: "day-2", date: "2026-11-15T00:00:00Z" },
      { ...first, id: "day-3", status: EVENT_DAY_STATUSES.CANCELLED },
    ];
    expect(buildDraftChecklist(event, 1).items[1]).toMatchObject({ title: "Datas", isDone: true });
  });

  it("concorda o item com uma congregação e deriva o total dos itens", () => {
    const result = buildDraftChecklist(buildEvent(), 1);
    expect(result.items.find((item) => item.id === "congregations")?.subtitle).toBe("1 congregação participa");
    expect(result.totalCount).toBe(result.items.length);
    expect(result.percent).toBe(Math.round((result.readyCount / result.items.length) * 100));
  });

  it("separa a descrição compacta dos horários e usa vírgula entre local e cidade", () => {
    const event = buildEvent();
    expect(getDraftEventDescription(event)).toBe("14/11/2026 · Salão, Campinas · R$\u00a040 por dia");
    expect(buildDraftChecklist(event).items.find((item) => item.id === "dates")?.subtitle).toBe(
      "14/11 · saída 06:30, retorno 18:30",
    );
  });
});
