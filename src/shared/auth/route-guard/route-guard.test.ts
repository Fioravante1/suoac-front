import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getSessionMock = vi.fn();

vi.mock("../session", () => ({
  getSession: () => getSessionMock(),
}));

import { routeGuard } from "./route-guard";
import type { SessionUser } from "../session";

const user: SessionUser = {
  id: "user-1",
  name: "Coordenador",
  email: "coord@suoac.dev",
  role: "CIRCUIT_COORDINATOR",
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

function request(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${path}`));
}

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("routeGuard", () => {
  it("redireciona não autenticado de rota privada para /login com returnUrl", async () => {
    getSessionMock.mockResolvedValue(null);

    const res = await routeGuard(request("/dashboard"));

    expect(res.headers.get("location")).toBe("http://localhost/login?returnUrl=%2Fdashboard");
  });

  it("preserva a query string no returnUrl", async () => {
    getSessionMock.mockResolvedValue(null);

    const res = await routeGuard(request("/events?page=2"));

    expect(res.headers.get("location")).toBe("http://localhost/login?returnUrl=%2Fevents%3Fpage%3D2");
  });

  it("permite não autenticado acessar /login", async () => {
    getSessionMock.mockResolvedValue(null);

    const res = await routeGuard(request("/login"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("redireciona autenticado fora de /login para /dashboard", async () => {
    getSessionMock.mockResolvedValue(user);

    const res = await routeGuard(request("/login"));

    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("permite autenticado acessar rota privada", async () => {
    getSessionMock.mockResolvedValue(user);

    const res = await routeGuard(request("/dashboard"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("força /change-password quando mustChangePassword é true", async () => {
    getSessionMock.mockResolvedValue({ ...user, mustChangePassword: true });

    const res = await routeGuard(request("/dashboard"));

    expect(res.headers.get("location")).toBe("http://localhost/change-password");
  });

  it("permite acessar /change-password mesmo com mustChangePassword true", async () => {
    getSessionMock.mockResolvedValue({ ...user, mustChangePassword: true });

    const res = await routeGuard(request("/change-password"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("redireciona autenticado sem pendência de /change-password para /dashboard", async () => {
    getSessionMock.mockResolvedValue(user);

    const res = await routeGuard(request("/change-password"));

    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
