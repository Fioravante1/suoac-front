"use server";

import { redirect } from "next/navigation";

import { httpClient, HttpError, endpoints } from "@/shared/api/http-client";
import { createSession } from "@/shared/auth/session";
import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth";
import { routes } from "@/shared/config";

import { changePasswordSchema } from "../model/change-password-schema";
import type { ChangePasswordResponseDto } from "./change-password.dto";

export interface ChangePasswordState {
  error?: string;
  /** Campo ao qual o erro pertence, para destaque inline (401 → senha atual, 422 → nova senha). */
  field?: "currentPassword" | "newPassword";
}

const GENERIC_ERROR = "Não foi possível alterar a senha. Tente novamente.";

/** Mapeia a falha do backend para o estado do formulário usando early returns. */
function mapChangePasswordError(error: unknown): ChangePasswordState {
  if (!(error instanceof HttpError)) {
    return { error: GENERIC_ERROR };
  }

  // Refresh falhou no http-client → sessão apagada: aciona o fluxo de relogin.
  if (error.message === SESSION_EXPIRED_MESSAGE) {
    return { error: SESSION_EXPIRED_MESSAGE };
  }

  // "Credenciais invalidas" = sessão/usuário inválido (não senha atual): força relogin.
  if (error.status === 401 && error.message.toLowerCase().includes("credenciais")) {
    return { error: SESSION_EXPIRED_MESSAGE };
  }

  if (error.status === 401) {
    return { field: "currentPassword", error: "Senha atual incorreta." };
  }

  if (error.status === 422) {
    return { field: "newPassword", error: "A nova senha deve ser diferente da atual." };
  }

  if (error.status === 400) {
    return { error: "Verifique os campos e tente novamente." };
  }

  return { error: GENERIC_ERROR };
}

export async function changePasswordAction(
  _prevState: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const result = changePasswordSchema.safeParse(raw);

  if (!result.success) {
    return { error: "Dados inválidos. Verifique os campos e tente novamente." };
  }

  try {
    const response = await httpClient<ChangePasswordResponseDto>(endpoints.auth.changePassword, {
      method: "POST",
      body: {
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
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
      mustChangePassword: response.user.mustChangePassword,
    });
  } catch (error) {
    return mapChangePasswordError(error);
  }

  redirect(routes.dashboard);
}
