"use server";

import {
  fetchCurrentEvent,
  fetchEvent,
  isEventVisibleTo,
  toEventViewer,
  type Event,
  type EventViewer,
} from "@/entities/event";
import { HttpError } from "@/shared/api/http-client";
import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth";
import { PASSWORD_CHANGE_REQUIRED_MESSAGE } from "@/shared/auth/constants";
import { deleteSession, getSession } from "@/shared/auth/session";

import { clearSelectedEventId, readSelectedEventId } from "../selected-event-cookie";

/**
 * Respostas que dizem que a escolha guardada deixou de valer: id inválido (`400`),
 * evento de outro circuito (`403`), evento apagado ou rascunho escondido do papel
 * (`404`). Qualquer outra falha é falha de verdade e sobe para a tela.
 */
const STALE_SELECTION_STATUSES: readonly number[] = [400, 403, 404];

/**
 * O `403` da troca de senha obrigatória vale para qualquer rota e não diz nada sobre
 * o evento: a escolha fica guardada para depois da troca.
 */
function isStaleSelectionError(error: unknown): boolean {
  if (!(error instanceof HttpError)) return false;
  if (error.message === PASSWORD_CHANGE_REQUIRED_MESSAGE) return false;

  return STALE_SELECTION_STATUSES.includes(error.status);
}

async function findSelectableEvent(eventId: string, viewer: EventViewer): Promise<Event | null> {
  try {
    const event = await fetchEvent(eventId);

    return isEventVisibleTo(event, viewer) ? event : null;
  } catch (error) {
    if (isStaleSelectionError(error)) return null;

    throw error;
  }
}

/**
 * O evento em que o shell novo abre: o escolhido pelo usuário, guardado no cookie,
 * enquanto ainda for visível para ele; senão, o evento atual do circuito pela regra
 * do evento padrão (SUC-120). `null` quando o circuito não tem evento atual.
 *
 * Roda como Server Action, e não durante a renderização do layout, porque a
 * renovação do access token grava cookie, o que o Next só permite em Server Action
 * e Route Handler. O circuito e o papel saem da sessão, nunca do navegador.
 */
export async function resolveSelectedEventAction(): Promise<Event | null> {
  const session = await getSession();

  if (!session) {
    // Em produção o Next troca a mensagem do erro lançado por uma genérica, e a tela não
    // reconhece a sessão expirada por ela. Apagar os cookies faz o layout voltar sem
    // usuário, e o `SessionGuard` leva ao login.
    await deleteSession();
    throw new HttpError(401, SESSION_EXPIRED_MESSAGE);
  }

  const viewer = toEventViewer(session);
  const selectedEventId = await readSelectedEventId(session.id);
  const selectedEvent = selectedEventId ? await findSelectableEvent(selectedEventId, viewer) : null;

  if (selectedEvent) return selectedEvent;

  // A escolha deixou de valer: apagar evita repetir a consulta perdida a cada visita.
  if (selectedEventId) await clearSelectedEventId();

  const currentEvent = await fetchCurrentEvent(session.circuitId);

  return currentEvent && isEventVisibleTo(currentEvent, viewer) ? currentEvent : null;
}
