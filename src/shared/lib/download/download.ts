/**
 * Extrai o nome do arquivo de um header `Content-Disposition`, cobrindo `filename*=UTF-8''...`
 * (RFC 5987, preferencial), `filename="..."` e fallback. O nome é sanitizado para remover
 * separadores de caminho e segmentos `..`, evitando nomes perigosos.
 */
export function parseContentDispositionFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return sanitizeFilename(fallback);

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    try {
      return sanitizeFilename(decodeURIComponent(utf8Match[1].trim()));
    } catch {
      // Cai para as próximas estratégias se a decodificação falhar.
    }
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(contentDisposition);
  if (quotedMatch?.[1]) {
    return sanitizeFilename(quotedMatch[1].trim());
  }

  const bareMatch = /filename=([^;]+)/i.exec(contentDisposition);
  if (bareMatch?.[1]) {
    return sanitizeFilename(bareMatch[1].trim());
  }

  return sanitizeFilename(fallback);
}

/** Reduz ao basename (último segmento de caminho) e remove pontos à esquerda, evitando traversal. */
function sanitizeFilename(name: string): string {
  const segments = name.replace(/\\/g, "/").split("/");
  const base = (segments[segments.length - 1] ?? "").replace(/^\.+/, "").trim();
  return base.length > 0 ? base : "download";
}

/**
 * Salva o corpo de uma `Response` como arquivo no navegador, usando o nome do header
 * `Content-Disposition` (com `fallbackName` quando ausente). Client-only.
 */
export async function downloadResponseAsFile(response: Response, fallbackName: string): Promise<void> {
  const blob = await response.blob();
  const filename = parseContentDispositionFilename(response.headers.get("Content-Disposition"), fallbackName);

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
