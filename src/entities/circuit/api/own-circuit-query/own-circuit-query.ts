"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { Circuit } from "../../model";

/** Busca o circuito de quem está na sessão. A API responde aos quatro papéis. */
export async function fetchOwnCircuit(): Promise<Circuit> {
  return httpClient<Circuit>(endpoints.circuits.own);
}
