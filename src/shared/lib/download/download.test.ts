import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { downloadResponseAsFile, parseContentDispositionFilename } from "./download";

describe("parseContentDispositionFilename", () => {
  it("usa o fallback quando o header está ausente", () => {
    expect(parseContentDispositionFilename(null, "inscritos-1.pdf")).toBe("inscritos-1.pdf");
  });

  it("prioriza filename*=UTF-8'' e decodifica", () => {
    const header = "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''inscritos-%C3%A1rea.pdf";
    expect(parseContentDispositionFilename(header, "x.pdf")).toBe("inscritos-área.pdf");
  });

  it('usa filename="..." quando não há filename*', () => {
    expect(parseContentDispositionFilename('attachment; filename="inscritos-001-2.pdf"', "x.pdf")).toBe(
      "inscritos-001-2.pdf",
    );
  });

  it("sanitiza separadores de caminho e segmentos .. (usa o basename)", () => {
    expect(parseContentDispositionFilename('attachment; filename="../../etc/passwd"', "x.pdf")).toBe("passwd");
  });
});

describe("downloadResponseAsFile", () => {
  const createObjectURL = vi.fn(() => "blob:fake");
  const revokeObjectURL = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL } as unknown as typeof URL);
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it("baixa o blob usando o nome do Content-Disposition", async () => {
    const response = new Response(new Blob(["%PDF-1.4"], { type: "application/pdf" }), {
      headers: { "Content-Disposition": 'attachment; filename="inscritos-1.pdf"' },
    });

    await downloadResponseAsFile(response, "fallback.pdf");

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });
});
