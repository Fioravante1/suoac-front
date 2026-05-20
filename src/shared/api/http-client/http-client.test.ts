import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { httpClient, HttpError } from "./http-client";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("API_BASE_URL", "https://api.test.com");
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(responseData);
  });

  it("lanca HttpError para resposta nao-ok com mensagem do backend", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid credentials" }),
    });

    await expect(httpClient("/auth/login", { method: "POST", body: {} })).rejects.toThrow(HttpError);

    try {
      await httpClient("/auth/login", { method: "POST", body: {} });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(401);
      expect((error as HttpError).message).toBe("Invalid credentials");
    }
  });

  it("lanca HttpError com mensagem padrao quando body nao tem message", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });

    await expect(httpClient("/fail")).rejects.toThrow(HttpError);

    try {
      await httpClient("/fail");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(500);
      expect((error as HttpError).message).toBe("Request failed with status 500");
    }
  });
});
