import type { User } from "@/entities/user";

export interface SignInResponseDto {
  accessToken: string;
  refreshToken: string;
  user: User;
}
