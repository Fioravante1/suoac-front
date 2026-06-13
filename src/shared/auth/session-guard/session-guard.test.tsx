import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { AuthProvider } from "../auth-context";
import type { SessionUser } from "../session";
import { USER_ROLES } from "../session/user-role";
import { redirectToSessionExpired, resetSessionRedirect } from "../session-redirect";

import { SessionGuard } from "./session-guard";

const mockLocationHref = vi.fn();

const mockUser: SessionUser = {
  id: "1",
  name: "Fulano",
  email: "fulano@example.com",
  role: USER_ROLES.CIRCUIT_COORDINATOR,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  resetSessionRedirect();

  Object.defineProperty(window, "location", {
    value: {
      pathname: "/dashboard",
      search: "",
      get href() {
        return `${this.pathname}${this.search}`;
      },
      set href(url: string) {
        mockLocationHref(url);
      },
    },
    writable: true,
  });
});

describe("SessionGuard", () => {
  it("redireciona para /login quando não há sessão ativa", () => {
    render(
      <AuthProvider user={null}>
        <SessionGuard />
      </AuthProvider>,
    );

    expect(mockLocationHref).toHaveBeenCalledWith(expect.stringContaining("/login?sessionExpired=true"));
  });

  it("exibe o overlay de sessão expirada enquanto redireciona", () => {
    render(
      <AuthProvider user={null}>
        <SessionGuard />
      </AuthProvider>,
    );

    expect(screen.getByText("Sua sessão expirou")).toBeInTheDocument();
  });

  it("não redireciona nem exibe overlay quando há sessão ativa", () => {
    render(
      <AuthProvider user={mockUser}>
        <SessionGuard />
      </AuthProvider>,
    );

    expect(mockLocationHref).not.toHaveBeenCalled();
    expect(screen.queryByText("Sua sessão expirou")).not.toBeInTheDocument();
  });

  it("exibe o overlay quando o redirect é disparado por outro caminho (mutation/query)", () => {
    render(
      <AuthProvider user={mockUser}>
        <SessionGuard />
      </AuthProvider>,
    );

    act(() => {
      redirectToSessionExpired();
    });

    expect(screen.getByText("Sua sessão expirou")).toBeInTheDocument();
  });

  it("redireciona apenas uma vez", () => {
    const { rerender } = render(
      <AuthProvider user={null}>
        <SessionGuard />
      </AuthProvider>,
    );

    rerender(
      <AuthProvider user={null}>
        <SessionGuard />
      </AuthProvider>,
    );

    expect(mockLocationHref).toHaveBeenCalledTimes(1);
  });
});
