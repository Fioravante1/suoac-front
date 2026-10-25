"use server";

import { httpClient, HttpError, endpoints } from "@/shared/api/http-client";
import { createSession, toSessionLifetime } from "@/shared/auth/session";
import { routes } from "@/shared/config";

import { signInSchema } from "../../model";
import type { SignInResponseDto } from "./sign-in.dto";

export interface SignInInput {
  email: string;
  password: string;
  /** "Manter conectado neste computador": pede a sessão estendida (SUC-39). */
  rememberMe: boolean;
  /** Para onde o usuario tentava ir quando foi barrado pelo gate de sessao. */
  returnUrl?: string | null;
}

export type SignInResult =
  | { status: "success"; firstName: string; redirectTo: string }
  | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível entrar agora. Verifique sua conexão e tente novamente.";

/**
 * Autentica e abre a sessao, devolvendo para onde ir — em vez de redirecionar
 * aqui mesmo.
 *
 * A diferenca em relacao a `features/sign-in`, que redireciona no servidor, e
 * deliberada: a tela nova confirma a entrada com "Bem-vindo, {nome}" antes de
 * sair, e um `redirect()` aqui tornaria esse momento inalcancavel. O nome vem
 * do backend; deriva-lo do e-mail, como o prototipo faz, saudaria
 * `secretaria@congregacao.org` como "Secretaria".
 *
 * Duplicacao temporaria, com data de morte conhecida: some no corte do login
 * legado (SUC-34). Ver `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` §3.1.
 */
export async function signInAction({ returnUrl, ...credentials }: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(credentials);

  if (!parsed.success) {
    return { status: "error", message: "Dados inválidos. Confira o e-mail e a senha." };
  }

  try {
    const response = await httpClient<SignInResponseDto>(endpoints.auth.login, {
      method: "POST",
      body: { email: parsed.data.email, password: parsed.data.password, rememberMe: parsed.data.rememberMe },
    });

    const { user } = response;

    await createSession(
      response.accessToken,
      response.refreshToken,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        circuitId: user.circuitId,
        congregationId: user.congregationId,
        mustChangePassword: user.mustChangePassword,
      },
      toSessionLifetime(response),
    );

    return {
      status: "success",
      firstName: toFirstName(user.name),
      // Primeiro acesso ignora para onde o usuario queria ir: trocar a senha
      // provisoria vem antes de qualquer outra coisa.
      redirectTo: user.mustChangePassword === true ? routes.changePassword : toSafeReturnUrl(returnUrl),
    };
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return { status: "error", message: "E-mail ou senha incorretos." };
    }

    return { status: "error", message: GENERIC_ERROR };
  }
}

function toFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/**
 * So aceita caminho interno. Sem isso, `?returnUrl=https://outro-site` faria a
 * propria tela de entrada despachar o usuario para fora depois de autenticar.
 */
function toSafeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl?.startsWith("/") || returnUrl.startsWith("//")) return routes.dashboard;

  return returnUrl;
}
