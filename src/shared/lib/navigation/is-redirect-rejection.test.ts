import { describe, expect, it } from "vitest";

import { isRedirectRejection } from "./is-redirect-rejection";

/** Formato real do que o Next rejeita: `Error` com `digest`. */
function redirectRejection(digest: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest });
}

describe("isRedirectRejection", () => {
  it("reconhece a rejeição de um redirect", () => {
    expect(isRedirectRejection(redirectRejection("NEXT_REDIRECT;replace;/dashboard;303;"))).toBe(true);
  });

  it("reconhece qualquer tipo e destino, pelo prefixo do digest", () => {
    expect(isRedirectRejection(redirectRejection("NEXT_REDIRECT;push;/reset-password?status=sucesso;307;"))).toBe(true);
  });

  it("não confunde com o digest de outro mecanismo do Next", () => {
    // `notFound()` tambem sinaliza por excecao, com digest proprio.
    expect(isRedirectRejection(redirectRejection("NEXT_HTTP_ERROR_FALLBACK;404"))).toBe(false);
  });

  it("não confunde com erro comum, que precisa continuar sendo tratado", () => {
    expect(isRedirectRejection(new Error("Failed to fetch"))).toBe(false);
  });

  it("aguenta o que não é objeto, sem lançar", () => {
    expect(isRedirectRejection(null)).toBe(false);
    expect(isRedirectRejection(undefined)).toBe(false);
    expect(isRedirectRejection("NEXT_REDIRECT")).toBe(false);
  });

  it("exige que o digest seja string", () => {
    expect(isRedirectRejection({ digest: 303 })).toBe(false);
  });
});
