import "server-only";

import { cookies } from "next/headers";

import { signSession, unsignSession } from "./session-signature";
import type { UserRole } from "./user-role";

export type { UserRole };

export interface SessionUser {
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

const ACCESS_TOKEN_COOKIE = "suoac-access-token";
const REFRESH_TOKEN_COOKIE = "suoac-refresh-token";
const USER_COOKIE = "suoac-user";

const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function cookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    // Todos os cookies de sessão são httpOnly: tokens nunca devem ser lidos por JS,
    // e o cookie de usuário chega ao client via prop do AuthProvider (server-side),
    // sem precisar de leitura no navegador.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function createSession(accessToken: string, refreshToken: string, user: SessionUser): Promise<void> {
  const cookieStore = await cookies();

  // O cookie de usuário é assinado (HMAC) para ser à prova de adulteração: impede que
  // o circuitId/role sejam editados no navegador para escalar acesso. Ver session-signature.
  const signedUser = await signSession(JSON.stringify(user));

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions());
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions());
  cookieStore.set(USER_COOKIE, signedUser, cookieOptions());
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(USER_COOKIE);

  if (!userCookie?.value) {
    return null;
  }

  const payload = await unsignSession(userCookie.value);

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as SessionUser;
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
