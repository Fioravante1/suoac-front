import type { UserRole } from "@/shared/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  circuitId: string;
  congregationId: string | null;
  /** Troca de senha obrigatória no primeiro acesso. Ausência é tratada como `false`. */
  mustChangePassword?: boolean;
}
