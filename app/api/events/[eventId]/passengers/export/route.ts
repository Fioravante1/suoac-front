import type { NextRequest } from "next/server";

import { exportEventPassengersPdfResponse } from "@/features/export-event-passengers-pdf/api/export-event-passengers-pdf-response";

/**
 * Proxy autenticado da exportação de PDF de inscritos. Roda server-side (lê o cookie de sessão),
 * delega para a server fn da feature e repassa o binário/erro. Runtime Node (default) — necessário
 * para `cookies()` e streaming do corpo.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ eventId: string }> }): Promise<Response> {
  const { eventId } = await ctx.params;
  const { searchParams } = request.nextUrl;

  return exportEventPassengersPdfResponse({
    eventId,
    congregationId: searchParams.get("congregationId") ?? undefined,
    includeSensitive: searchParams.get("includeSensitive") === "true",
  });
}
