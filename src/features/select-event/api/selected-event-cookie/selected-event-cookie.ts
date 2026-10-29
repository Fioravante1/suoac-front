import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

/**
 * Cookie com a escolha de evento do shell novo (SUC-104), no formato `<usuário>:<evento>`. A
 * escolha é de quem a fez: outro usuário que entre no mesmo navegador abre no evento padrão, e o
 * logout não precisa saber deste cookie.
 */
export const SELECTED_EVENT_COOKIE_NAME = "suoac-event";

/**
 * Doze horas: a escolha atravessa um dia de trabalho, e na visita do dia seguinte a regra do
 * evento padrão volta a decidir. Assim, um evento finalizado aberto para consulta não continua
 * escondendo, dias depois, o evento que está com inscrições abertas. O prazo é explícito, e não o
 * do cookie de sessão do navegador, porque navegadores que restauram a sessão guardam esse cookie
 * indefinidamente.
 */
const SELECTED_EVENT_MAX_AGE_SECONDS = 60 * 60 * 12;

const OWNER_SEPARATOR = ":";

const eventIdSchema = z.uuid();

/** `httpOnly` porque só o servidor lê e grava: a troca passa por Server Action. */
function cookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number } {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SELECTED_EVENT_MAX_AGE_SECONDS,
  };
}

/** O id, quando é um UUID; qualquer outra coisa vale como escolha nenhuma. */
export function parseEventId(value: string | null | undefined): string | null {
  const parsed = eventIdSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}

/**
 * Id do evento escolhido pelo usuário, ou `null` quando ele não escolheu nenhum, quando a escolha
 * guardada é de outro usuário ou quando o valor guardado não é um id.
 */
export async function readSelectedEventId(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const [ownerId, eventId] = cookieStore.get(SELECTED_EVENT_COOKIE_NAME)?.value.split(OWNER_SEPARATOR) ?? [];

  if (ownerId !== userId) return null;

  return parseEventId(eventId);
}

export async function writeSelectedEventId(userId: string, eventId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SELECTED_EVENT_COOKIE_NAME, `${userId}${OWNER_SEPARATOR}${eventId}`, cookieOptions());
}

export async function clearSelectedEventId(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SELECTED_EVENT_COOKIE_NAME);
}
