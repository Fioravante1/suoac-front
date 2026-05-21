import type { LucideIcon } from "lucide-react";

import { USER_ROLES, type UserRole } from "../session/user-role";

const CIRCUIT_ROLES: ReadonlySet<UserRole> = new Set([USER_ROLES.CIRCUIT_COORDINATOR, USER_ROLES.CIRCUIT_ASSISTANT]);

export function isCircuitRole(role: UserRole): boolean {
  return CIRCUIT_ROLES.has(role);
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export function filterNavItems(items: readonly NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
