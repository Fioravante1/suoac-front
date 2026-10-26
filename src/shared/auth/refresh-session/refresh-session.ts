import "server-only";

import { endpoints } from "@/shared/api/http-client";

import { createSession, getRefreshToken, toSessionLifetime } from "../session";
import type { SessionUser } from "../session";

interface RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  extendedSession?: boolean;
  refreshExpiresIn?: number;
  user: SessionUser;
}

export async function refreshSession(): Promise<string | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoints.auth.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as RefreshResponseDto;

    // A renovação preserva o modo: a sessão estendida volta como estendida.
    await createSession(data.accessToken, data.refreshToken, data.user, toSessionLifetime(data));

    return data.accessToken;
  } catch {
    return null;
  }
}
