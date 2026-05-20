"use client";

import { createContext, useContext } from "react";

import type { SessionUser } from "../session";

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
});

type AuthProviderProps = Readonly<{
  user: SessionUser | null;
  children: React.ReactNode;
}>;

export function AuthProvider({ user, children }: AuthProviderProps) {
  return <AuthContext value={{ user, isAuthenticated: user !== null }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
