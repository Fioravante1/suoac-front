import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetRefreshToken = vi.fn();
const mockCreateSession = vi.fn();

vi.mock("../session", () => ({
  getRefreshToken: (...args: unknown[]) => mockGetRefreshToken(...args),
  createSession: (...args: unknown[]) => mockCreateSession(...args),
}));

import { refreshSession } from "./refresh-session";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const testUser = {
  id: "user-1",
  name: "Test User",
  email: "test@suoac.dev",
  role: "CIRCUIT_COORDINATOR",
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("API_BASE_URL", "https://api.test.com");
});

describe("refreshSession", () => {
  it("retorna novo access token quando refresh retorna 200", async () => {
    mockGetRefreshToken.mockResolvedValue("refresh-token-123");

    const responseData = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: testUser,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(responseData),
    });

    const result = await refreshSession();

    expect(result).toBe("new-access-token");
    expect(fetchMock).toHaveBeenCalledWith("https://api.test.com/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "refresh-token-123" }),
    });
    expect(mockCreateSession).toHaveBeenCalledWith("new-access-token", "new-refresh-token", testUser);
  });

  it("retorna null quando nao ha refresh token", async () => {
    mockGetRefreshToken.mockResolvedValue(null);

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna null quando backend retorna 401", async () => {
    mockGetRefreshToken.mockResolvedValue("expired-refresh-token");

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("retorna null quando fetch lanca excecao", async () => {
    mockGetRefreshToken.mockResolvedValue("refresh-token-123");

    fetchMock.mockRejectedValue(new Error("Network error"));

    const result = await refreshSession();

    expect(result).toBeNull();
  });

  it("retorna null quando API_BASE_URL nao esta configurada", async () => {
    vi.stubEnv("API_BASE_URL", "");
    mockGetRefreshToken.mockResolvedValue("refresh-token-123");

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
