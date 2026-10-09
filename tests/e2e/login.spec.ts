import { expect, test } from "@playwright/test";

/**
 * Fumaça da tela de entrada.
 *
 * Cobre o que teste unitário não alcança: a página renderizada pelo servidor, o
 * tema estampado antes da primeira pintura e os cabeçalhos de segurança da
 * resposta real.
 *
 * Não exercita autenticação: o login acontece em Server Action, que chama a API
 * a partir do servidor e não do navegador — `page.route` não a alcança. A
 * estratégia de dados para esses fluxos entra na Fatia 1, junto com os testes que
 * precisarem dela.
 */
test.describe("tela de entrada", () => {
  test("carrega e apresenta o formulário", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /bem-vindo/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("valida os campos antes de enviar", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /entrar/i }).click();

    // A validação é do cliente: nenhuma chamada ao servidor é necessária para
    // o usuário saber o que falta.
    await expect(page.getByText("Por favor, insira um e-mail válido.")).toBeVisible();
    await expect(page.getByText("A senha deve conter no mínimo 6 caracteres.")).toBeVisible();
  });

  test("protege rota privada de quem não tem sessão", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("tema", () => {
  test("serve a página clara para quem nunca escolheu tema", async ({ page }) => {
    // Mesmo com o sistema operacional em escuro: é a trava que mantém telas ainda
    // não redesenhadas legíveis. Ver SUC-15 e SUC-17.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  });

  test("aplica o tema escolhido já na resposta do servidor", async ({ page, context }) => {
    await context.addCookies([{ name: "suoac-theme", value: "dark", url: "http://127.0.0.1:3100" }]);

    const response = await page.goto("/login");
    const html = (await response?.text()) ?? "";

    // Verificado no HTML entregue, não no DOM: é o que garante ausência de flash.
    expect(html).toContain('data-theme="dark"');
  });

  test("contém o tema escuro nas telas ainda não redesenhadas", async ({ page, context }) => {
    await context.addCookies([{ name: "suoac-theme", value: "dark", url: "http://127.0.0.1:3100" }]);
    await page.goto("/login");

    const backgroundDoEscopo = await page
      .locator('[class*="scope"]')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);

    // Fundo claro do design system, apesar do tema escuro ativo no <html>.
    expect(backgroundDoEscopo).toBe("rgb(247, 249, 248)");
  });

  test("descarta valor de cookie que não reconhece", async ({ page, context }) => {
    await context.addCookies([
      { name: "suoac-theme", value: '"><script>alert(1)</script>', url: "http://127.0.0.1:3100" },
    ]);

    const response = await page.goto("/login");
    const html = (await response?.text()) ?? "";

    expect(html).not.toContain("data-theme=");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});

test.describe("cabeçalhos de segurança", () => {
  test("entrega CSP com nonce e sem script inline solto", async ({ page }) => {
    const response = await page.goto("/login");

    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src[^;]*'nonce-/);

    const scriptsSemNonce = await page.locator("script:not([nonce])").count();
    expect(scriptsSemNonce).toBe(0);
  });
});
