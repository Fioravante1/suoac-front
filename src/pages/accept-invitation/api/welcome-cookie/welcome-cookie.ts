import "server-only";

import { cookies } from "next/headers";

import { routes } from "@/shared/config";

import { welcomeSummarySchema, type WelcomeSummary } from "../../model";

const WELCOME_COOKIE = "suoac-invitation-welcome";

/** Cinco minutos: o tempo de a navegacao da action chegar a tela de boas-vindas, com folga. */
const MAX_AGE_SECONDS = 5 * 60;

/**
 * Guarda o resumo do aceite para a tela de boas-vindas, que vem logo depois.
 *
 * O aceite consome o token e a action termina em `redirect`, porque escrever o
 * cookie de sessao numa Server Action faz o Next re-renderizar a rota com a
 * resposta — e a re-renderizacao consultaria o token ja consumido, trocando a
 * tela por "convite ja usado" na cara de quem acabou de aceitar. O `redirect`
 * corta esse caminho, mas a tela seguinte nao tem mais de onde ler o convite.
 * Este cookie e a ponte: vale poucos minutos, e so para a rota do aceite.
 *
 * `httpOnly`, mas sem assinatura: o conteudo e o que essa mesma pessoa acabou
 * de ver na tela de aceite, e so e renderizado como texto para ela.
 */
export async function saveWelcomeSummary(summary: WelcomeSummary): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(WELCOME_COOKIE, Buffer.from(JSON.stringify(summary)).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: routes.acceptInvitation,
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Resumo do aceite recem-concluido, ou `null` se nao ha, expirou ou esta corrompido. */
export async function readWelcomeSummary(): Promise<WelcomeSummary | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(WELCOME_COOKIE)?.value;

  if (!value) {
    return null;
  }

  try {
    const parsed = welcomeSummarySchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
