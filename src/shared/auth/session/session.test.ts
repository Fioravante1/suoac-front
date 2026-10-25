import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
const mockHas = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockSet,
      get: mockGet,
      delete: mockDelete,
      has: mockHas,
    }),
  ),
}));

// Assinatura mockada de forma determinística: `signed(<payload>)` representa o token
// gravado no cookie; `unsignSession` reverte apenas tokens nesse formato.
vi.mock("./session-signature", () => ({
  signSession: vi.fn((payload: string) => Promise.resolve(`signed(${payload})`)),
  unsignSession: vi.fn((token: string) =>
    Promise.resolve(token.startsWith("signed(") && token.endsWith(")") ? token.slice(7, -1) : null),
  ),
}));

import {
  createSession,
  getSession,
  getAccessToken,
  getRefreshToken,
  deleteSession,
  hasSession,
  toSessionLifetime,
} from "./session";
import type { SessionUser } from "./session";

const testUser: SessionUser = {
  id: "user-1",
  name: "Coordenador de Circuito",
  email: "coord@suoac.dev",
  role: "CIRCUIT_COORDINATOR",
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  it("seta 3 cookies com os valores corretos", async () => {
    await createSession("access-token-123", "refresh-token-456", testUser);

    expect(mockSet).toHaveBeenCalledTimes(3);

    expect(mockSet).toHaveBeenCalledWith(
      "suoac-access-token",
      "access-token-123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      "suoac-refresh-token",
      "refresh-token-456",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      "suoac-user",
      `signed(${JSON.stringify(testUser)})`,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });
});

describe("createSession — duração", () => {
  function maxAgesOfCookies(): unknown[] {
    return mockSet.mock.calls.map(([, , options]) => (options as { maxAge?: number }).maxAge);
  }

  it("grava cookies de sessão, sem maxAge, no modo padrão: somem ao fechar o navegador", async () => {
    await createSession("a", "r", testUser);

    expect(maxAgesOfCookies()).toEqual([undefined, undefined, undefined]);
  });

  it("grava os três cookies com o tempo informado pelo backend na sessão estendida", async () => {
    await createSession("a", "r", testUser, { extended: true, refreshExpiresIn: 2592000 });

    expect(maxAgesOfCookies()).toEqual([2592000, 2592000, 2592000]);
  });
});

describe("toSessionLifetime", () => {
  it("lê a sessão estendida da resposta do backend", () => {
    expect(toSessionLifetime({ extendedSession: true, refreshExpiresIn: 2592000 })).toEqual({
      extended: true,
      refreshExpiresIn: 2592000,
    });
  });

  it.each([
    ["resposta sem os campos", {}],
    ["extendedSession falso", { extendedSession: false, refreshExpiresIn: 604800 }],
    ["tempo ausente", { extendedSession: true }],
    ["tempo inválido", { extendedSession: true, refreshExpiresIn: 0 }],
  ])("cai na sessão padrão com %s", (_caso, response) => {
    expect(toSessionLifetime(response).extended).toBe(false);
  });
});

describe("getSession", () => {
  it("retorna usuario quando o cookie tem assinatura valida", async () => {
    mockGet.mockReturnValue({ value: `signed(${JSON.stringify(testUser)})` });

    const session = await getSession();

    expect(mockGet).toHaveBeenCalledWith("suoac-user");
    expect(session).toEqual(testUser);
  });

  it("retorna null quando cookie nao existe", async () => {
    mockGet.mockReturnValue(undefined);

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("retorna null quando a assinatura do cookie e invalida (adulterado)", async () => {
    mockGet.mockReturnValue({ value: JSON.stringify(testUser) });

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("retorna null quando o payload assinado tem JSON invalido", async () => {
    mockGet.mockReturnValue({ value: "signed(invalid-json)" });

    const session = await getSession();

    expect(session).toBeNull();
  });
});

describe("getAccessToken", () => {
  it("retorna token quando cookie existe", async () => {
    mockGet.mockReturnValue({ value: "access-token-123" });

    const token = await getAccessToken();

    expect(mockGet).toHaveBeenCalledWith("suoac-access-token");
    expect(token).toBe("access-token-123");
  });

  it("retorna null quando cookie nao existe", async () => {
    mockGet.mockReturnValue(undefined);

    const token = await getAccessToken();

    expect(token).toBeNull();
  });
});

describe("getRefreshToken", () => {
  it("retorna token quando cookie existe", async () => {
    mockGet.mockReturnValue({ value: "refresh-token-456" });

    const token = await getRefreshToken();

    expect(mockGet).toHaveBeenCalledWith("suoac-refresh-token");
    expect(token).toBe("refresh-token-456");
  });

  it("retorna null quando cookie nao existe", async () => {
    mockGet.mockReturnValue(undefined);

    const token = await getRefreshToken();

    expect(token).toBeNull();
  });
});

describe("deleteSession", () => {
  it("limpa os 3 cookies", async () => {
    await deleteSession();

    expect(mockDelete).toHaveBeenCalledTimes(3);
    expect(mockDelete).toHaveBeenCalledWith("suoac-access-token");
    expect(mockDelete).toHaveBeenCalledWith("suoac-refresh-token");
    expect(mockDelete).toHaveBeenCalledWith("suoac-user");
  });
});

describe("hasSession", () => {
  it("retorna true quando access token existe", async () => {
    mockHas.mockReturnValue(true);

    const result = await hasSession();

    expect(mockHas).toHaveBeenCalledWith("suoac-access-token");
    expect(result).toBe(true);
  });

  it("retorna false quando access token nao existe", async () => {
    mockHas.mockReturnValue(false);

    const result = await hasSession();

    expect(result).toBe(false);
  });
});
