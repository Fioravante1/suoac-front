import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Event } from "@/entities/event";
import { SESSION_EXPIRED_MESSAGE, type SessionUser } from "@/shared/auth";

const mocks = vi.hoisted(() => ({
  fetchEvent: vi.fn(),
  getSession: vi.fn(),
  deleteSession: vi.fn(),
  writeSelectedEventId: vi.fn(),
}));

vi.mock("@/entities/event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/event")>()),
  fetchEvent: mocks.fetchEvent,
}));

vi.mock("@/shared/auth/session", () => ({ getSession: mocks.getSession, deleteSession: mocks.deleteSession }));

vi.mock("../selected-event-cookie", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../selected-event-cookie")>()),
  writeSelectedEventId: mocks.writeSelectedEventId,
}));

import { selectEventAction } from "./select-event-action";

const EVENT_ID = "5b0f9c2e-3d4a-4b6c-8e7f-9a0b1c2d3e4f";

const coordinator: SessionUser = {
  id: "user-1",
  name: "Coordenador",
  email: "coord@suoac.dev",
  role: "CIRCUIT_COORDINATOR",
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: EVENT_ID,
    title: "Congresso regional",
    type: "REGIONAL_CONVENTION",
    ticketPrice: "40.00",
    status: "OPEN",
    registrationDeadline: "2026-06-01T00:00:00.000Z",
    paymentDeadline: "2026-06-15T00:00:00.000Z",
    venue: "Estádio",
    address: "Av. Central, 1",
    city: "São Paulo",
    state: "SP",
    observations: null,
    circuitId: "circuit-1",
    createdById: "user-1",
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    days: [],
    ...overrides,
  };
}

describe("selectEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(coordinator);
  });

  it("guarda a escolha em nome do usuário e devolve o evento conferido no backend", async () => {
    const event = buildEvent();
    mocks.fetchEvent.mockResolvedValue(event);

    const result = await selectEventAction(EVENT_ID);

    expect(result).toEqual({ success: true, data: event });
    expect(mocks.fetchEvent).toHaveBeenCalledWith(EVENT_ID);
    expect(mocks.writeSelectedEventId).toHaveBeenCalledWith("user-1", EVENT_ID);
  });

  it("recusa id inválido sem consultar a API nem guardar nada", async () => {
    const result = await selectEventAction("evento-1");

    expect(result).toEqual({ success: false, error: "Evento inválido." });
    expect(mocks.fetchEvent).not.toHaveBeenCalled();
    expect(mocks.writeSelectedEventId).not.toHaveBeenCalled();
  });

  it("não guarda rascunho para papel da congregação", async () => {
    mocks.getSession.mockResolvedValue({ ...coordinator, role: "CONGREGATION_ASSISTANT", congregationId: "cong-1" });
    mocks.fetchEvent.mockResolvedValue(buildEvent({ status: "DRAFT" }));

    const result = await selectEventAction(EVENT_ID);

    expect(result).toEqual({ success: false, error: "Evento não encontrado." });
    expect(mocks.writeSelectedEventId).not.toHaveBeenCalled();
  });

  it("não guarda evento de outro circuito", async () => {
    mocks.fetchEvent.mockResolvedValue(buildEvent({ circuitId: "circuit-2" }));

    const result = await selectEventAction(EVENT_ID);

    expect(result).toEqual({ success: false, error: "Evento não encontrado." });
    expect(mocks.writeSelectedEventId).not.toHaveBeenCalled();
  });

  it("devolve a mensagem da API quando a consulta falha, sem guardar nada", async () => {
    mocks.fetchEvent.mockRejectedValue(new Error("Evento não encontrado"));

    const result = await selectEventAction(EVENT_ID);

    expect(result).toEqual({ success: false, error: "Evento não encontrado" });
    expect(mocks.writeSelectedEventId).not.toHaveBeenCalled();
  });

  it("usa mensagem padrão para falha desconhecida", async () => {
    mocks.fetchEvent.mockRejectedValue("unknown");

    const result = await selectEventAction(EVENT_ID);

    expect(result).toEqual({ success: false, error: "Não foi possível trocar o evento." });
  });

  it("responde como sessão expirada e apaga os cookies da sessão quando não há sessão", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await selectEventAction(EVENT_ID);

    expect(result).toEqual({ success: false, error: SESSION_EXPIRED_MESSAGE });
    expect(mocks.deleteSession).toHaveBeenCalled();
    expect(mocks.fetchEvent).not.toHaveBeenCalled();
  });
});
