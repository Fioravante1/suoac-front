export { AuthProvider, useAuth } from "./auth-context";
export { SessionGuard } from "./session-guard";
export { useAuthPermissions } from "./use-auth-permissions";
export type { SessionUser, UserRole } from "./session";
export { SESSION_EXPIRED_MESSAGE } from "./constants";
export { USER_ROLES } from "./session/user-role";
export { isCircuitRole, filterNavItems } from "./rbac";
export type { NavItem } from "./rbac";
// Helper client-safe (só depende de constants) para redirecionar em sessão expirada fora do fluxo
// de Server Action (ex.: download via fetch que recebe 401).
export { redirectToSessionExpired } from "./session-redirect";
