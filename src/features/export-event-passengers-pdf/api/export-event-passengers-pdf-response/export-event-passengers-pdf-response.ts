import "server-only";

import { endpoints, httpClientRaw, HttpError } from "@/shared/api/http-client";
import { getSession } from "@/shared/auth/session";

interface ExportParams {
  eventId: string;
  congregationId?: string;
  /** Variante do PDF (`carrier`/`boarding`). Repassada como string; o backend valida (400 se inválida). */
  variant?: string;
}

const GENERIC_ERROR = "Não foi possível exportar o PDF.";

function jsonError(statusCode: number, message: string): Response {
  return Response.json({ statusCode, message }, { status: statusCode });
}

/** Normaliza `message` do backend, que pode vir como string ou string[]. */
function normalizeMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return value.map(String).join(", ");
  return fallback;
}

/**
 * Proxy server-side da exportação de PDF de inscritos. Lê a sessão (circuitId/token), chama o backend
 * via `httpClientRaw` e devolve uma `Response`:
 * - sucesso → repassa o binário (Content-Type/Content-Disposition);
 * - erro do backend → normaliza para JSON `{ statusCode, message }` preservando o status;
 * - sessão expirada → 401 JSON.
 *
 * Server-only. Consumido apenas pelo Route Handler em `/app`.
 */
export async function exportEventPassengersPdfResponse({
  eventId,
  congregationId,
  variant,
}: ExportParams): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return jsonError(401, "Sessão expirada. Faça login novamente.");
  }

  const params = new URLSearchParams();
  if (congregationId) params.set("congregationId", congregationId);
  if (variant) params.set("variant", variant);

  const basePath = endpoints.eventPassengers.exportPdf(session.circuitId, eventId);
  const query = params.toString();
  const path = query ? `${basePath}?${query}` : basePath;

  try {
    const upstream = await httpClientRaw(path);

    if (!upstream.ok) {
      const text = await upstream.text();
      let message = GENERIC_ERROR;

      try {
        const parsed = JSON.parse(text) as { message?: unknown };
        message = normalizeMessage(parsed.message, GENERIC_ERROR);
      } catch {
        message = normalizeMessage(text, GENERIC_ERROR);
      }

      return jsonError(upstream.status, message);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/pdf",
        "Content-Disposition":
          upstream.headers.get("Content-Disposition") ?? `attachment; filename="inscritos-${eventId}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.status, error.message);
    }

    return jsonError(500, GENERIC_ERROR);
  }
}
