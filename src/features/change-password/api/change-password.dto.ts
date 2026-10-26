import type { User } from "@/entities/user";

export interface ChangePasswordResponseDto {
  accessToken: string;
  refreshToken: string;
  /** Sessão de "Manter conectado" (SUC-39). Ausência vale como sessão padrão. */
  extendedSession?: boolean;
  /** Tempo de vida do refresh token, em segundos. */
  refreshExpiresIn?: number;
  user: User;
}
