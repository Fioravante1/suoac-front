import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

import { AuthProvider } from "../auth-context";
import type { SessionUser } from "../session";
import { USER_ROLES } from "../session/user-role";
import { resetSessionRedirect } from "../session-redirect";

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

  it("não redireciona quando há sessão ativa", () => {
    render(
      <AuthProvider user={mockUser}>
        <SessionGuard />
      </AuthProvider>,
    );

    expect(mockLocationHref).not.toHaveBeenCalled();
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
