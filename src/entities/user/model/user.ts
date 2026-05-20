import type { UserRole } from "@/shared/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  circuitId: string;
  congregationId: string | null;
}
