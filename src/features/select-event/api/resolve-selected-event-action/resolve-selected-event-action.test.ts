import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Event } from "@/entities/event";
import { HttpError } from "@/shared/api/http-client";
import type { SessionUser } from "@/shared/auth";
import { PASSWORD_CHANGE_REQUIRED_MESSAGE } from "@/shared/auth/constants";

const mocks = vi.hoisted(() => ({
  fetchEvent: vi.fn(),
  fetchCurrentEvent: vi.fn(),
  getSession: vi.fn(),
  deleteSession: vi.fn(),
  readSelectedEventId: vi.fn(),
  clearSelectedEventId: vi.fn(),
}));

vi.mock("@/entities/event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/event")>()),
  fetchEvent: mocks.fetchEvent,
  fetchCurrentEvent: mocks.fetchCurrentEvent,
}));

vi.mock("@/shared/auth/session", () => ({ getSession: mocks.getSession, deleteSession: mocks.deleteSession }));

vi.mock("../selected-event-cookie", () => ({
  readSelectedEventId: mocks.readSelectedEventId,
  clearSelectedEventId: mocks.clearSelectedEventId,
}));

import { resolveSelectedEventAction } from "./resolve-selected-event-action";

const SELECTED_ID = "5b0f9c2e-3d4a-4b6c-8e7f-9a0b1c2d3e4f";

const coordinator: SessionUser = {
  id: "user-1",
  name: "Coordenador",
  email: "coord@suoac.dev",
  role: "CIRCUIT_COORDINATOR",
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

const congregationCoordinator: SessionUser = {
  ...coordinator,
  role: "CONGREGATION_COORDINATOR",
  congregationId: "cong-1",
};

function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: SELECTED_ID,
    title: "Assembleia de circuito",
    type: "ASSEMBLY",
    ticketPrice: "25.00",
    status: "FINISHED",
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
    days: [],
    ...overrides,
  };
}

const currentEvent = buildEvent({ id: "current-event", status: "OPEN" });

describe("resolveSelectedEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(coordinator);
    mocks.fetchCurrentEvent.mockResolvedValue(currentEvent);
  });

  it("devolve o evento escolhido enquanto ele ainda é visível, sem consultar o evento atual", async () => {
    const chosen = buildEvent();
    mocks.readSelectedEventId.mockResolvedValue(SELECTED_ID);
    mocks.fetchEvent.mockResolvedValue(chosen);

    await expect(resolveSelectedEventAction()).resolves.toEqual(chosen);
    expect(mocks.readSelectedEventId).toHaveBeenCalledWith("user-1");
    expect(mocks.fetchEvent).toHaveBeenCalledWith(SELECTED_ID);
    expect(mocks.fetchCurrentEvent).not.toHaveBeenCalled();
    expect(mocks.clearSelectedEventId).not.toHaveBeenCalled();
  });

  it("cai no evento atual do circuito da sessão quando não há escolha guardada", async () => {
    mocks.readSelectedEventId.mockResolvedValue(null);

    await expect(resolveSelectedEventAction()).resolves.toEqual(currentEvent);
    expect(mocks.fetchCurrentEvent).toHaveBeenCalledWith("circuit-1");
    expect(mocks.fetchEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["inexistente ou apagado", 404],
    ["de outro circuito", 403],
    ["com id recusado pela API", 400],
  ])("descarta a escolha de evento %s e cai no evento atual", async (_caso, status) => {
    mocks.readSelectedEventId.mockResolvedValue(SELECTED_ID);
    mocks.fetchEvent.mockRejectedValue(new HttpError(status, "Evento não encontrado"));

    await expect(resolveSelectedEventAction()).resolves.toEqual(currentEvent);
    expect(mocks.clearSelectedEventId).toHaveBeenCalled();
  });

  it("descarta evento de outro circuito mesmo que a API o devolva", async () => {
    mocks.readSelectedEventId.mockResolvedValue(SELECTED_ID);
    mocks.fetchEvent.mockResolvedValue(buildEvent({ circuitId: "circuit-2" }));

    await expect(resolveSelectedEventAction()).resolves.toEqual(currentEvent);
    expect(mocks.clearSelectedEventId).toHaveBeenCalled();
  });

  it("nunca entrega rascunho a papel da congregação, nem pela escolha guardada", async () => {
    mocks.getSession.mockResolvedValue(congregationCoordinator);
    mocks.readSelectedEventId.mockResolvedValue(SELECTED_ID);
    mocks.fetchEvent.mockResolvedValue(buildEvent({ status: "DRAFT" }));

    await expect(resolveSelectedEventAction()).resolves.toEqual(currentEvent);
    expect(mocks.clearSelectedEventId).toHaveBeenCalled();
  });

  it("mantém a escolha quando a API pede a troca de senha obrigatória", async () => {
    mocks.readSelectedEventId.mockResolvedValue(SELECTED_ID);
    mocks.fetchEvent.mockRejectedValue(new HttpError(403, PASSWORD_CHANGE_REQUIRED_MESSAGE));

    await expect(resolveSelectedEventAction()).rejects.toThrow(PASSWORD_CHANGE_REQUIRED_MESSAGE);
    expect(mocks.clearSelectedEventId).not.toHaveBeenCalled();
    expect(mocks.fetchCurrentEvent).not.toHaveBeenCalled();
  });

  it("nunca entrega rascunho a papel da congregação, nem pelo evento atual", async () => {
    mocks.getSession.mockResolvedValue(congregationCoordinator);
    mocks.readSelectedEventId.mockResolvedValue(null);
    mocks.fetchCurrentEvent.mockResolvedValue(buildEvent({ status: "DRAFT" }));

    await expect(resolveSelectedEventAction()).resolves.toBeNull();
  });

  it("descarta evento atual de outro circuito mesmo que a API o devolva", async () => {
    mocks.readSelectedEventId.mockResolvedValue(null);
    mocks.fetchCurrentEvent.mockResolvedValue(buildEvent({ status: "OPEN", circuitId: "circuit-2" }));

    await expect(resolveSelectedEventAction()).resolves.toBeNull();
  });

  it("devolve null quando o circuito não tem evento atual", async () => {
    mocks.readSelectedEventId.mockResolvedValue(null);
    mocks.fetchCurrentEvent.mockResolvedValue(null);

    await expect(resolveSelectedEventAction()).resolves.toBeNull();
  });

  it("propaga falha da API ao buscar a escolha, sem apagá-la", async () => {
    mocks.readSelectedEventId.mockResolvedValue(SELECTED_ID);
    mocks.fetchEvent.mockRejectedValue(new HttpError(500, "Erro interno"));

    await expect(resolveSelectedEventAction()).rejects.toThrow("Erro interno");
    expect(mocks.clearSelectedEventId).not.toHaveBeenCalled();
  });

  it("propaga falha da API ao buscar o evento atual", async () => {
    mocks.readSelectedEventId.mockResolvedValue(null);
    mocks.fetchCurrentEvent.mockRejectedValue(new Error("Network error"));

    await expect(resolveSelectedEventAction()).rejects.toThrow("Network error");
  });

  it("falha como sessão expirada e apaga os cookies da sessão quando não há sessão", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(resolveSelectedEventAction()).rejects.toMatchObject({ status: 401 });
    expect(mocks.deleteSession).toHaveBeenCalled();
    expect(mocks.fetchCurrentEvent).not.toHaveBeenCalled();
  });
});
