import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";
import { updateEventAction } from "./update-event-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    events: {
      update: (id: string) => `/events/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

const event: Event = {
  id: "event-1",
  title: "Assembleia SP 2026",
  type: EVENT_TYPES.ASSEMBLY,
  ticketPrice: "25.00",
  status: EVENT_STATUSES.DRAFT,
  registrationDeadline: "2026-06-01T00:00:00.000Z",
  paymentDeadline: "2026-06-15T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
};

const values = {
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

describe("updateEventAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(event);
  });

  it("chama o endpoint de atualização do evento", async () => {
    const result = await updateEventAction("event-1", EVENT_STATUSES.DRAFT, values);

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1", {
      method: "PATCH",
      body: expect.objectContaining({ title: "Assembleia SP 2026" }),
    });
  });

  it("bloqueia edição para evento finalizado", async () => {
    const result = await updateEventAction("event-1", EVENT_STATUSES.FINISHED, values);

    expect(result).toEqual({ success: false, error: "Este evento não pode mais ser editado." });
  });
});
