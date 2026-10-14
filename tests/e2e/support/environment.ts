/**
 * Endereco e segredos do servidor que o Playwright sobe.
 *
 * Vivem num modulo proprio porque `playwright.config.ts` e os testes precisam
 * dos mesmos valores: o servidor e configurado com eles, e os testes assinam
 * cookies que o servidor tem de conseguir abrir.
 */
export const E2E_PORT = 3100;

export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

/**
 * Segredo do Flags SDK usado para assinar overrides de flag no E2E.
 *
 * Fixo e publico de proposito; nao protege nada. So precisa ser uma chave de
 * 256 bits valida em base64url, identica no servidor e no teste. O segredo real
 * vem da Vercel e nunca entra no repositorio.
 */
export const E2E_FLAGS_SECRET = "c3VvYWMtZTJlLWZsYWdzLXNlY3JldC1zZW0tdmFsb3I";

/** Segredo HMAC do cookie de sessao. Mesmo raciocinio do anterior. */
export const E2E_SESSION_SECRET = "e2e-session-secret-sem-valor-real";
