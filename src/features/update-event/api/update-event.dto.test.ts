import { describe, expect, it } from "vitest";

import { EVENT_STATUSES, type EventStatus } from "@/entities/event";

import { mapUpdateEventFormToDto } from "./update-event.dto";

const values = {
  title: " Assembleia SP 2026 ",
  ticketPrice: "25,50",
  registrationDeadline: "2026-06-01",
  paymentDeadline: "2026-06-15",
  venue: " Salão Central ",
  address: " Rua das Flores, 100 ",
  city: " São Paulo ",
  state: "sp",
  observations: " Observação ",
};

// Os prazos como a API grava o 01/06 e o 15/06: o último instante do dia em São Paulo.
function eventIn(status: EventStatus) {
  return { status, registrationDeadline: "2026-06-02T02:59:59.999Z", paymentDeadline: "2026-06-16T02:59:59.999Z" };
}

describe("mapUpdateEventFormToDto", () => {
  it("envia os campos editáveis do rascunho, sem os prazos que não mudaram", () => {
    expect(mapUpdateEventFormToDto(values, eventIn(EVENT_STATUSES.DRAFT))).toEqual({
      title: "Assembleia SP 2026",
      ticketPrice: 25.5,
      venue: "Salão Central",
      address: "Rua das Flores, 100",
      city: "São Paulo",
      state: "SP",
      observations: "Observação",
    });
  });

  it("envia o prazo que mudou, e só ele", () => {
    const dto = mapUpdateEventFormToDto(
      { ...values, registrationDeadline: "2026-06-05" },
      eventIn(EVENT_STATUSES.OPEN),
    );

    expect(dto).toHaveProperty("registrationDeadline", "2026-06-05");
    expect(dto).not.toHaveProperty("paymentDeadline");
  });

  it("não envia os prazos de evento aberto quando ninguém os alterou, como na edição do assistente", () => {
    const dto = mapUpdateEventFormToDto({ ...values, title: "Novo título" }, eventIn(EVENT_STATUSES.OPEN));

    expect(dto).not.toHaveProperty("registrationDeadline");
    expect(dto).not.toHaveProperty("paymentDeadline");
    expect(dto).toHaveProperty("title", "Novo título");
  });

  it("envia apenas observações para evento encerrado", () => {
    expect(mapUpdateEventFormToDto(values, eventIn(EVENT_STATUSES.CLOSED))).toEqual({ observations: "Observação" });
  });
});
