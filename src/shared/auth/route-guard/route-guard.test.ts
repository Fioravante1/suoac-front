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
  describe("rota aberta por link com token", () => {
    it("deixa passar sem sessão", async () => {
      getSessionMock.mockResolvedValue(null);

      const res = await routeGuard(request("/reset-password?token=abc"));

      expect(res.headers.get("location")).toBeNull();
    });

    it("deixa passar com sessão, em vez de mandar para o painel", async () => {
      // Computador compartilhado: a sessão aberta pode ser de outra pessoa, e
      // mandar para o painel dela quebraria o link de quem clicou no e-mail.
      getSessionMock.mockResolvedValue({ ...user, mustChangePassword: false });

      const res = await routeGuard(request("/reset-password?token=abc"));

      expect(res.headers.get("location")).toBeNull();
    });

    it("deixa passar com troca de senha obrigatória pendente", async () => {
      // Redefinir pelo link resolve a pendência; prender na tela de troca seria beco.
      getSessionMock.mockResolvedValue({ ...user, mustChangePassword: true });

      const res = await routeGuard(request("/reset-password?token=abc"));

      expect(res.headers.get("location")).toBeNull();
    });

    it("não consulta a sessão para decidir", async () => {
      getSessionMock.mockResolvedValue(null);

      await routeGuard(request("/reset-password?token=abc"));

      expect(getSessionMock).not.toHaveBeenCalled();
    });
  });

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

  it.each(["/privacidade", "/ajuda"])("permite não autenticado acessar %s", async (path) => {
    // São alcançadas pelo rodapé da tela de entrada. Se o gate as barrar, o link
    // devolve o visitante para /login e parece quebrado, mesmo com a página no ar.
    getSessionMock.mockResolvedValue(null);

    const res = await routeGuard(request(path));

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
