import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "../auth-context";
import type { SessionUser } from "../session";
import { USER_ROLES } from "../session/user-role";
import { useAuthPermissions } from "./use-auth-permissions";

const circuitCoordinator: SessionUser = {
  id: "user-1",
  name: "Coordenador",
  email: "coordenador@suoac.dev",
  role: USER_ROLES.CIRCUIT_COORDINATOR,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

function createWrapper(user: SessionUser | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider user={user}>{children}</AuthProvider>;
  };
}

describe("useAuthPermissions", () => {
  it("retorna permissões falsas quando não há usuário", () => {
    const { result } = renderHook(() => useAuthPermissions(), { wrapper: createWrapper(null) });

    expect(result.current.user).toBeNull();
    expect(result.current.userRole).toBeNull();
    expect(result.current.userCircuitId).toBe("");
    expect(result.current.userCongregationId).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isCircuitUser).toBe(false);
    expect(result.current.isCircuitCoordinator).toBe(false);
    expect(result.current.isCircuitAssistant).toBe(false);
    expect(result.current.isCongregationCoordinator).toBe(false);
    expect(result.current.isCongregationAssistant).toBe(false);
  });

  it("identifica coordenador de circuito", () => {
    const { result } = renderHook(() => useAuthPermissions(), { wrapper: createWrapper(circuitCoordinator) });

    expect(result.current.userRole).toBe(USER_ROLES.CIRCUIT_COORDINATOR);
    expect(result.current.userCircuitId).toBe("circuit-1");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isCircuitUser).toBe(true);
    expect(result.current.isCircuitCoordinator).toBe(true);
    expect(result.current.isCircuitAssistant).toBe(false);
    expect(result.current.isCongregationCoordinator).toBe(false);
    expect(result.current.isCongregationAssistant).toBe(false);
  });

  it("identifica assistente de circuito", () => {
    const circuitAssistant: SessionUser = {
      ...circuitCoordinator,
      role: USER_ROLES.CIRCUIT_ASSISTANT,
    };

    const { result } = renderHook(() => useAuthPermissions(), { wrapper: createWrapper(circuitAssistant) });

    expect(result.current.userRole).toBe(USER_ROLES.CIRCUIT_ASSISTANT);
    expect(result.current.isCircuitUser).toBe(true);
    expect(result.current.isCircuitCoordinator).toBe(false);
    expect(result.current.isCircuitAssistant).toBe(true);
    expect(result.current.isCongregationCoordinator).toBe(false);
    expect(result.current.isCongregationAssistant).toBe(false);
  });

  it("identifica coordenador de congregação", () => {
    const congregationCoordinator: SessionUser = {
      ...circuitCoordinator,
      role: USER_ROLES.CONGREGATION_COORDINATOR,
      congregationId: "cong-1",
    };

    const { result } = renderHook(() => useAuthPermissions(), { wrapper: createWrapper(congregationCoordinator) });

    expect(result.current.userCongregationId).toBe("cong-1");
    expect(result.current.isCircuitUser).toBe(false);
    expect(result.current.isCircuitCoordinator).toBe(false);
    expect(result.current.isCircuitAssistant).toBe(false);
    expect(result.current.isCongregationCoordinator).toBe(true);
    expect(result.current.isCongregationAssistant).toBe(false);
  });

  it("identifica assistente de congregação", () => {
    const congregationUser: SessionUser = {
      ...circuitCoordinator,
      role: USER_ROLES.CONGREGATION_ASSISTANT,
      congregationId: "cong-1",
    };

    const { result } = renderHook(() => useAuthPermissions(), { wrapper: createWrapper(congregationUser) });

    expect(result.current.userCongregationId).toBe("cong-1");
    expect(result.current.isCircuitUser).toBe(false);
    expect(result.current.isCircuitCoordinator).toBe(false);
    expect(result.current.isCircuitAssistant).toBe(false);
    expect(result.current.isCongregationCoordinator).toBe(false);
    expect(result.current.isCongregationAssistant).toBe(true);
  });
});
