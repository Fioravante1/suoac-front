import { describe, expect, it } from "vitest";

import { mapCreateEventFormToDto } from "./create-event.dto";

describe("mapCreateEventFormToDto", () => {
  it("normaliza os dados do formulário para o contrato do backend", () => {
    const dto = mapCreateEventFormToDto({
      title: " Assembleia SP 2026 ",
      type: "ASSEMBLY",
      ticketPrice: "25,50",
      registrationDeadline: "2026-06-01",
      paymentDeadline: "2026-06-15",
      venue: " Salão Central ",
      address: " Rua das Flores, 100 ",
      city: " São Paulo ",
      state: "sp",
      date: "2026-07-10",
      endDate: "",
      departureTime: "06:00",
      returnTime: "18:00",
      observations: " Opcional ",
    });

    expect(dto).toEqual({
      title: "Assembleia SP 2026",
      type: "ASSEMBLY",
      ticketPrice: 25.5,
      registrationDeadline: "2026-06-01",
      paymentDeadline: "2026-06-15",
      venue: "Salão Central",
      address: "Rua das Flores, 100",
      city: "São Paulo",
      state: "SP",
      date: "2026-07-10",
      departureTime: "06:00",
      returnTime: "18:00",
      observations: "Opcional",
    });
  });

  it("inclui endDate para congresso regional", () => {
    const dto = mapCreateEventFormToDto({
      title: "Congresso 2026",
      type: "REGIONAL_CONVENTION",
      ticketPrice: "30.00",
      registrationDeadline: "2026-06-01",
      paymentDeadline: "2026-06-15",
      venue: "Salão Central",
      address: "Rua das Flores, 100",
      city: "São Paulo",
      state: "SP",
      date: "2026-07-10",
      endDate: "2026-07-12",
      departureTime: "06:00",
      returnTime: "18:00",
      observations: "",
    });

    expect(dto.endDate).toBe("2026-07-12");
  });
});
