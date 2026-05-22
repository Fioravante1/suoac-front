import { describe, expect, it } from "vitest";

import { EVENT_STATUSES } from "@/entities/event";

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

describe("mapUpdateEventFormToDto", () => {
  it("envia todos os campos editáveis para evento em rascunho", () => {
    expect(mapUpdateEventFormToDto(values, EVENT_STATUSES.DRAFT)).toEqual({
      title: "Assembleia SP 2026",
      ticketPrice: 25.5,
      registrationDeadline: "2026-06-01",
      paymentDeadline: "2026-06-15",
      venue: "Salão Central",
      address: "Rua das Flores, 100",
      city: "São Paulo",
      state: "SP",
      observations: "Observação",
    });
  });

  it("nao envia prazo de inscrição para evento aberto", () => {
    expect(mapUpdateEventFormToDto(values, EVENT_STATUSES.OPEN)).not.toHaveProperty("registrationDeadline");
  });

  it("envia apenas observações para evento encerrado", () => {
    expect(mapUpdateEventFormToDto(values, EVENT_STATUSES.CLOSED)).toEqual({ observations: "Observação" });
  });
});
