import { describe, expect, it } from "vitest";

import { formatCancellationHeader } from "./cancelled-summary";

describe("formatCancellationHeader", () => {
  it("lê o cancelamento em São Paulo e apresenta o autor", () => {
    const result = formatCancellationHeader({
      cancelledAt: "2026-10-09T01:00:00Z",
      cancelledBy: { id: "user", name: "Marcos Oliveira" },
    });
    expect(result.desktopTitle).toBe("Cancelado em 08/10 por Marcos Oliveira");
    expect(result.compactTitle).toBe("Evento cancelado em 08/10");
    expect(result.compactSubtitle).toBe("Por Marcos Oliveira. Inscrições e pagamentos estão bloqueados.");
  });

  it("mostra a data quando o autor não existe mais", () => {
    expect(formatCancellationHeader({ cancelledAt: "2026-10-08T15:00:00Z", cancelledBy: null }).desktopTitle).toBe(
      "Cancelado em 08/10",
    );
  });

  it("não inventa data nem autor em evento legado", () => {
    const result = formatCancellationHeader({});
    expect(result.desktopTitle).toBe("Evento cancelado");
    expect(result.compactSubtitle).toBe("Inscrições e pagamentos estão bloqueados.");
  });
});
