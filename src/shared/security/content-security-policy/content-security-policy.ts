import "server-only";

/**
 * Geração de Content-Security-Policy por requisição (nonce).
 *
 * Estratégia: nonce em `script-src` + `strict-dynamic` (bloqueia XSS via script
 * injetado, que é o vetor principal). `style-src` mantém `'unsafe-inline'` porque
 * o app não usa scripts inline próprios, mas há estilos inline legítimos (ex.: o
 * `<style>` do `global-error`, estilos do `next/font`); inline de estilo tem risco
 * baixo comparado a script. O Next lê o header CSP da requisição e aplica o nonce
 * automaticamente nos seus próprios scripts durante o SSR.
 */

/** Gera um nonce único e imprevisível para uma requisição. */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * Monta o valor do header `Content-Security-Policy` para o nonce informado.
 *
 * Em desenvolvimento, `'unsafe-eval'` é necessário (o React usa `eval` para
 * debugging) e `upgrade-insecure-requests` é omitido (quebraria o dev em
 * http://localhost).
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];

  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
