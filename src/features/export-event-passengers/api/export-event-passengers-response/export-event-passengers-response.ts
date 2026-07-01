import "server-only";

import { endpoints, httpClientRaw, HttpError } from "@/shared/api/http-client";
import { getSession } from "@/shared/auth/session";

import { EXPORT_FORMAT_CONTENT_TYPES, parseExportFormat } from "../../model/export-format";

interface ExportParams {
  eventId: string;
  congregationId?: string;
  /** Variante da lista (`carrier`/`boarding`). Repassada como string; o backend valida (400 se inválida). */
  variant?: string;
  /** Formato cru vindo da query (`pdf`/`xlsx`). Validado aqui via `parseExportFormat`. */
  format?: string;
}

const GENERIC_ERROR = "Não foi possível exportar o arquivo.";

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
 * Proxy server-side da exportação de inscritos (PDF ou Excel). Lê a sessão (circuitId/token), valida
 * o formato, chama o backend via `httpClientRaw` e devolve uma `Response`:
 * - formato inválido → 400 JSON (sem tocar o backend);
 * - sucesso → repassa o binário (Content-Type/Content-Disposition);
 * - erro do backend → normaliza para JSON `{ statusCode, message }` preservando o status;
 * - sessão expirada → 401 JSON.
 *
 * Server-only. Consumido apenas pelo Route Handler em `/app`.
 */
export async function exportEventPassengersResponse({
  eventId,
  congregationId,
  variant,
  format: rawFormat,
}: ExportParams): Promise<Response> {
  const format = parseExportFormat(rawFormat ?? null);

  if (format === null) {
    return jsonError(400, "Formato de exportação inválido.");
  }

  const session = await getSession();

  if (!session) {
    return jsonError(401, "Sessão expirada. Faça login novamente.");
  }

  const params = new URLSearchParams();
  if (congregationId) params.set("congregationId", congregationId);
  if (variant) params.set("variant", variant);

  const basePath = endpoints.eventPassengers.export(session.circuitId, eventId, format);
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
        "Content-Type": upstream.headers.get("Content-Type") ?? EXPORT_FORMAT_CONTENT_TYPES[format],
        "Content-Disposition":
          upstream.headers.get("Content-Disposition") ?? `attachment; filename="inscritos-${eventId}.${format}"`,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.status, error.message);
    }

    return jsonError(500, GENERIC_ERROR);
  }
}
