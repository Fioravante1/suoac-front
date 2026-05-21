import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetAccessToken = vi.fn();
const mockDeleteSession = vi.fn();

vi.mock("@/shared/auth/session", () => ({
  getAccessToken: (...args: unknown[]) => mockGetAccessToken(...args),
  deleteSession: (...args: unknown[]) => mockDeleteSession(...args),
}));

const mockRefreshSession = vi.fn();

vi.mock("@/shared/auth/refresh-session", () => ({
  refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
}));

import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth/constants";

import { httpClient, HttpError } from "./http-client";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("API_BASE_URL", "https://api.test.com");
  mockGetAccessToken.mockResolvedValue("test-token");
  mockDeleteSession.mockResolvedValue(undefined);
});

describe("httpClient", () => {
  it("faz requisicao GET e retorna dados", async () => {
    const data = { id: "1", name: "Test" };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await httpClient("/users/1");

    expect(fetchMock).toHaveBeenCalledWith("https://api.test.com/users/1", {
      method: "GET",
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual(data);
  });

  it("faz requisicao POST com body JSON", async () => {
    const responseData = { accessToken: "token" };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(responseData),
    });

    const body = { email: "a@b.com", password: "123456" };
    const result = await httpClient("/auth/login", { method: "POST", body });

    expect(fetchMock).toHaveBeenCalledWith("https://api.test.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(responseData);
  });

  it("retorna undefined para resposta 204", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await httpClient("/resource/1", { method: "DELETE" });

    expect(result).toBeUndefined();
  });

  it("lanca HttpError para resposta nao-ok com mensagem do backend", async () => {
    mockGetAccessToken.mockResolvedValue(null);

    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Bad request" }),
    });

    try {
      await httpClient("/fail", { method: "POST", body: {} });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(400);
      expect((error as HttpError).message).toBe("Bad request");
    }
  });

  it("lanca HttpError com mensagem padrao quando body nao tem message", async () => {
    mockGetAccessToken.mockResolvedValue(null);

    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });

    try {
      await httpClient("/fail");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(500);
      expect((error as HttpError).message).toBe("Request failed with status 500");
    }
  });

  it("401 com token → refresh → retry 200 → retorna dados", async () => {
    const retryData = { id: "1", name: "Refreshed" };

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Token expired" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(retryData),
      });

    mockRefreshSession.mockResolvedValue("new-access-token");

    const result = await httpClient("/protected");

    expect(mockRefreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("https://api.test.com/protected", {
      method: "GET",
      headers: { Authorization: "Bearer new-access-token" },
    });
    expect(result).toEqual(retryData);
    expect(mockDeleteSession).not.toHaveBeenCalled();
  });

  it("401 com token → refresh → retry falha → lanca HttpError", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Token expired" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: "Forbidden" }),
      });

    mockRefreshSession.mockResolvedValue("new-access-token");

    try {
      await httpClient("/protected");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(403);
      expect((error as HttpError).message).toBe("Forbidden");
    }

    expect(mockRefreshSession).toHaveBeenCalledOnce();
    expect(mockDeleteSession).not.toHaveBeenCalled();
  });

  it("401 com token → refresh null → deleta sessao e lanca HttpError 401", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Token expired" }),
    });

    mockRefreshSession.mockResolvedValue(null);

    try {
      await httpClient("/protected");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(401);
      expect((error as HttpError).message).toBe(SESSION_EXPIRED_MESSAGE);
    }

    expect(mockDeleteSession).toHaveBeenCalledOnce();
  });

  it("401 sem token → lanca HttpError sem tentar refresh e sem deletar sessao", async () => {
    mockGetAccessToken.mockResolvedValue(null);

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid credentials" }),
    });

    try {
      await httpClient("/auth/login", { method: "POST", body: {} });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(401);
      expect((error as HttpError).message).toBe("Invalid credentials");
    }

    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(mockDeleteSession).not.toHaveBeenCalled();
  });

  it("erro nao-401 → lanca HttpError sem tentar refresh e sem deletar sessao", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Internal server error" }),
    });

    try {
      await httpClient("/fail");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(500);
      expect((error as HttpError).message).toBe("Internal server error");
    }

    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(mockDeleteSession).not.toHaveBeenCalled();
  });
});
