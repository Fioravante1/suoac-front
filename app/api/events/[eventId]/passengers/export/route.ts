import type { NextRequest } from "next/server";

import { exportEventPassengersResponse } from "@/features/export-event-passengers/api/export-event-passengers-response";

/**
 * Proxy autenticado da exportação de inscritos (PDF/Excel). Roda server-side (lê o cookie de sessão),
 * delega para a server fn da feature e repassa o binário/erro. Runtime Node (default) — necessário
 * para `cookies()` e streaming do corpo. O `format` é validado no proxy (400 se inválido).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ eventId: string }> }): Promise<Response> {
  const { eventId } = await ctx.params;
  const { searchParams } = request.nextUrl;

  return exportEventPassengersResponse({
    eventId,
    congregationId: searchParams.get("congregationId") ?? undefined,
    variant: searchParams.get("variant") ?? undefined,
    format: searchParams.get("format") ?? undefined,
  });
}
