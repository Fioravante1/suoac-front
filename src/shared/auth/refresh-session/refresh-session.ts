import "server-only";

import { endpoints } from "@/shared/api/http-client";

import { createSession, getRefreshToken } from "../session";
import type { SessionUser } from "../session";

interface RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
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

    await createSession(data.accessToken, data.refreshToken, data.user);

    return data.accessToken;
  } catch {
    return null;
  }
}
