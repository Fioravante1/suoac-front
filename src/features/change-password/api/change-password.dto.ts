import type { User } from "@/entities/user";

export interface ChangePasswordResponseDto {
  accessToken: string;
  refreshToken: string;
  user: User;
}
