"use server";

import { redirect } from "next/navigation";

import { httpClient, HttpError, endpoints } from "@/shared/api/http-client";
import { createSession } from "@/shared/auth/session";
import { routes } from "@/shared/config";

import { signInSchema } from "../model/sign-in-schema";
import type { SignInResponseDto } from "./sign-in.dto";

export interface SignInState {
  error?: string;
}

export async function signInAction(_prevState: SignInState | undefined, formData: FormData): Promise<SignInState> {
  const returnUrl = formData.get("returnUrl") as string | null;

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = signInSchema.safeParse(raw);

  if (!result.success) {
    return { error: "Dados inválidos. Verifique os campos e tente novamente." };
  }

  try {
    const response = await httpClient<SignInResponseDto>(endpoints.auth.login, {
      method: "POST",
      body: {
        email: result.data.email,
        password: result.data.password,
      },
    });

    await createSession(response.accessToken, response.refreshToken, {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      role: response.user.role,
      isActive: response.user.isActive,
      circuitId: response.user.circuitId,
      congregationId: response.user.congregationId,
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return { error: "E-mail ou senha incorretos." };
    }

    return { error: "Ocorreu um erro inesperado. Tente novamente." };
  }

  const safeReturnUrl = returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : null;

  redirect(safeReturnUrl ?? routes.dashboard);
}
