"use client";

import { useAuth } from "../auth-context";
import { isCircuitRole } from "../rbac";
import type { SessionUser, UserRole } from "../session";
import { USER_ROLES } from "../session/user-role";

interface UseAuthPermissionsReturn {
  user: SessionUser | null;
  userRole: UserRole | null;
  userCircuitId: string;
  userCongregationId: string | null;
  isAuthenticated: boolean;
  isCircuitUser: boolean;
  isCircuitCoordinator: boolean;
  isCircuitAssistant: boolean;
  isCongregationCoordinator: boolean;
  isCongregationAssistant: boolean;
}

export function useAuthPermissions(): UseAuthPermissionsReturn {
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role ?? null;

  return {
    user,
    userRole,
    userCircuitId: user?.circuitId ?? "",
    userCongregationId: user?.congregationId ?? null,
    isAuthenticated,
    isCircuitUser: userRole ? isCircuitRole(userRole) : false,
    isCircuitCoordinator: userRole === USER_ROLES.CIRCUIT_COORDINATOR,
    isCircuitAssistant: userRole === USER_ROLES.CIRCUIT_ASSISTANT,
    isCongregationCoordinator: userRole === USER_ROLES.CONGREGATION_COORDINATOR,
    isCongregationAssistant: userRole === USER_ROLES.CONGREGATION_ASSISTANT,
  };
}
