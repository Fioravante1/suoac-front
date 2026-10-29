"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { Event } from "../../model";

/**
 * Busca o evento atual do circuito, pela regra do evento padrão que o backend aplica (SUC-120):
 * inscrições abertas, depois encerradas que ainda não terminaram, depois o rascunho mais recente
 * (só para os papéis do circuito). Vem com os dias. Retorna `null` quando o circuito não tem evento
 * atual, que a API responde com `204`.
 */
export async function fetchCurrentEvent(circuitId: string): Promise<Event | null> {
  const event = await httpClient<Event | undefined>(endpoints.events.current(circuitId));

  return event ?? null;
}
