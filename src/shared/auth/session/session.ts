import "server-only";

import { cookies } from "next/headers";

export type UserRole =
  | "CIRCUIT_COORDINATOR"
  | "CIRCUIT_ASSISTANT"
  | "CONGREGATION_COORDINATOR"
  | "CONGREGATION_ASSISTANT";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  circuitId: string;
  congregationId: string | null;
}

const ACCESS_TOKEN_COOKIE = "suoac-access-token";
const REFRESH_TOKEN_COOKIE = "suoac-refresh-token";
const USER_COOKIE = "suoac-user";

const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function cookieOptions(httpOnly: boolean): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function createSession(accessToken: string, refreshToken: string, user: SessionUser): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(true));
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(true));
  cookieStore.set(USER_COOKIE, JSON.stringify(user), cookieOptions(false));
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(USER_COOKIE);

  if (!userCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(userCookie.value) as SessionUser;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(USER_COOKIE);
}

export async function hasSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ACCESS_TOKEN_COOKIE);
}
