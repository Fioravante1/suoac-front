import { expect, test } from "@playwright/test";

import { E2E_API_BASE_URL, E2E_BASE_URL } from "./support/environment";
import { overrideFlags } from "./support/feature-flags";

/**
 * A fachada de `/login` com a flag `REDESIGN_LOGIN` ligada (SUC-24).
 *
 * O lado desligado da fachada e a tela atual estao em `login.spec.ts`: sem chave
 * do Vercel Flags, toda flag cai no `defaultValue`, e desligada e o estado natural
 * da suite. Aqui a flag e forcada por override assinado — ver
 * `support/feature-flags.ts`.
 *
 * Nao repete o que o teste unitario da tela ja cobre. O que so existe aqui e a
 * rota real: a URL que a fachada serve, o tema aplicado antes da primeira pintura
 * e os cabecalhos da resposta.
 */
test.describe("fachada de /login com o redesign ligado", () => {
  test.beforeEach(async ({ context }) => {
    await overrideFlags(context, { REDESIGN_LOGIN: true });
  });

  test("serve a tela redesenhada na mesma URL", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(`${E2E_BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    // A URL nunca muda entre as versoes: nada de `/v2`. Ver estratégia §2.1.
    await expect(page.getByRole("heading", { name: /bem-vindo de volta/i })).toBeHidden();
  });

  test("preserva o returnUrl que o route guard anexa", async ({ page }) => {
    await page.goto("/dashboard");

    // O gate de autenticação precisa funcionar igual nas duas versões, inclusive
    // a fronteira de suspense que a tela nova usa para ler os search params.
    await expect(page).toHaveURL(`${E2E_BASE_URL}/login?returnUrl=%2Fdashboard`);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("solicita a recuperação de senha e confirma o prazo do link", async ({ page, request }) => {
    await request.delete(`${E2E_API_BASE_URL}/__requests`);
    await page.goto("/login");

    await page.getByRole("button", { name: "Esqueci a senha" }).click();
    await expect(page.getByRole("heading", { name: "Recuperar senha" })).toBeVisible();
    await page.getByLabel("E-mail").fill("coordenador@circuito.org");
    await page.getByRole("button", { name: "Enviar link" }).click();

    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("O link será válido por 1 hora.");

    const recordedRequests = await request.get(`${E2E_API_BASE_URL}/__requests`);
    await expect(recordedRequests).toBeOK();
    await expect(recordedRequests.json()).resolves.toEqual({
      passwordResetRequests: [{ email: "coordenador@circuito.org" }],
    });
  });

  test("acompanha o tema escuro escolhido", async ({ page, context }) => {
    await context.addCookies([{ name: "suoac-theme", value: "dark", url: E2E_BASE_URL }]);

    await page.goto("/login");

    const cor = await page
      .getByRole("heading", { name: "Entrar" })
      .evaluate((element) => getComputedStyle(element).color);

    // `--suoac-color-text-primary` do tema escuro. Se a contenção de tema legada
    // voltasse a envolver esta tela, aqui viria o texto escuro do tema claro.
    expect(cor).toBe("rgb(233, 239, 237)");
  });

  test("não é envolvida pela contenção de tema das telas legadas", async ({ page, context }) => {
    await context.addCookies([{ name: "suoac-theme", value: "dark", url: E2E_BASE_URL }]);

    await page.goto("/login");

    // Selecionar por classe é exceção consciente: o escopo não tem papel nem
    // texto acessível — existe só para pintar. É o mesmo recurso de `login.spec.ts`.
    await expect(page.locator('[class*="scope"]')).toHaveCount(0);
  });

  test("entrega CSP com nonce e sem script inline solto", async ({ page }) => {
    const response = await page.goto("/login");

    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src[^;]*'nonce-/);

    const scriptsSemNonce = await page.locator("script:not([nonce])").count();
    expect(scriptsSemNonce).toBe(0);
  });
});

test.describe("reversibilidade da fachada", () => {
  test("devolve a tela antiga ao desligar a flag", async ({ page, context }) => {
    await overrideFlags(context, { REDESIGN_LOGIN: false });

    await page.goto("/login");

    // É o kill switch da fatia: desligar a flag basta, sem deploy.
    await expect(page.getByRole("heading", { name: /bem-vindo de volta/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeHidden();
  });
});
