"use server";

import { fetchEvent, isEventVisibleTo, toEventViewer, type Event } from "@/entities/event";
import type { ActionResult } from "@/shared/api";
import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth";
import { deleteSession, getSession } from "@/shared/auth/session";

import { parseEventId, writeSelectedEventId } from "../selected-event-cookie";

/**
 * Troca o evento selecionado no shell novo. Confere o evento no backend antes de
 * guardar a escolha, para nunca gravar um id que a próxima visita teria de
 * descartar, e devolve o evento para a tela atualizar sem outra ida à API.
 *
 * Gravar o cookie faz o Next renderizar a rota de novo no servidor. Aqui isso custa
 * só o payload RSC: layout e páginas não chamam a API durante a renderização.
 */
export async function selectEventAction(eventId: string): Promise<ActionResult<Event>> {
  const validEventId = parseEventId(eventId);

  if (!validEventId) {
    return { success: false, error: "Evento inválido." };
  }

  const session = await getSession();

  if (!session) {
    // Sem os cookies, o layout volta sem usuário e o `SessionGuard` leva ao login.
    await deleteSession();
    return { success: false, error: SESSION_EXPIRED_MESSAGE };
  }

  try {
    const event = await fetchEvent(validEventId);

    if (!isEventVisibleTo(event, toEventViewer(session))) {
      return { success: false, error: "Evento não encontrado." };
    }

    await writeSelectedEventId(session.id, event.id);

    return { success: true, data: event };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível trocar o evento.";

    return { success: false, error: message };
  }
}
