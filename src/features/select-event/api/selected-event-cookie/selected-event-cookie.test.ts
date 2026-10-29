import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

import {
  SELECTED_EVENT_COOKIE_NAME,
  clearSelectedEventId,
  parseEventId,
  readSelectedEventId,
  writeSelectedEventId,
} from "./selected-event-cookie";

const USER_ID = "user-1";
const EVENT_ID = "5b0f9c2e-3d4a-4b6c-8e7f-9a0b1c2d3e4f";

describe("selected-event-cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lê o id do evento escolhido pelo usuário", async () => {
    cookieStore.get.mockReturnValue({ value: `${USER_ID}:${EVENT_ID}` });

    await expect(readSelectedEventId(USER_ID)).resolves.toBe(EVENT_ID);
    expect(cookieStore.get).toHaveBeenCalledWith(SELECTED_EVENT_COOKIE_NAME);
  });

  it("ignora a escolha de outro usuário no mesmo navegador", async () => {
    cookieStore.get.mockReturnValue({ value: `user-2:${EVENT_ID}` });

    await expect(readSelectedEventId(USER_ID)).resolves.toBeNull();
  });

  it("devolve null quando não há escolha guardada", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(readSelectedEventId(USER_ID)).resolves.toBeNull();
  });

  it.each([
    ["sem dono", EVENT_ID],
    ["com id que não é UUID", `${USER_ID}:../../admin`],
    ["sem id", `${USER_ID}:`],
  ])("trata valor %s como escolha nenhuma", async (_caso, value) => {
    cookieStore.get.mockReturnValue({ value });

    await expect(readSelectedEventId(USER_ID)).resolves.toBeNull();
  });

  it("grava a escolha do usuário como cookie httpOnly que vale por doze horas", async () => {
    await writeSelectedEventId(USER_ID, EVENT_ID);

    expect(cookieStore.set).toHaveBeenCalledWith(SELECTED_EVENT_COOKIE_NAME, `${USER_ID}:${EVENT_ID}`, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  });

  it("marca o cookie como secure em produção", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await writeSelectedEventId(USER_ID, EVENT_ID);

    expect(cookieStore.set).toHaveBeenCalledWith(
      SELECTED_EVENT_COOKIE_NAME,
      `${USER_ID}:${EVENT_ID}`,
      expect.objectContaining({ secure: true }),
    );
  });

  it("apaga a escolha guardada", async () => {
    await clearSelectedEventId();

    expect(cookieStore.delete).toHaveBeenCalledWith(SELECTED_EVENT_COOKIE_NAME);
  });

  it.each([
    ["vazio", ""],
    ["nulo", null],
    ["ausente", undefined],
    ["texto qualquer", "evento-1"],
  ])("parseEventId recusa valor %s", (_caso, value) => {
    expect(parseEventId(value)).toBeNull();
  });
});
