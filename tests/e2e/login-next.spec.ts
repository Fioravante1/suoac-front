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

/**
 * Autocadastro de circuito, a estrutura em etapas (SUC-28).
 *
 * O teste unitario ja cobre navegacao, validacao por etapa e preservacao do
 * preenchimento. O que so existe aqui e o fluxo real: um formulario que
 * atravessa tres etapas numa rota servida pelo servidor, com a flag ligada, e
 * um campo que continua preenchido depois de o bloco ter sido desmontado e
 * remontado pelo React de verdade — nao pelo jsdom.
 */
test.describe("autocadastro de circuito em etapas", () => {
  test.beforeEach(async ({ context, page }) => {
    await overrideFlags(context, { REDESIGN_LOGIN: true });
    await page.goto("/login");
    await page.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/i }).click();
  });

  test("abre pelo atalho da tela de entrada e volta para ela", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Cadastre seu circuito" })).toBeVisible();
    await expect(page.getByText("Etapa 1 de 3")).toBeVisible();

    await page.getByRole("button", { name: "Voltar para o login" }).click();

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("atravessa as tres etapas e preserva o que foi digitado ao voltar", async ({ page }) => {
    await page.getByLabel("Nome completo").fill("João Silva");
    await page.getByLabel("E-mail").fill("joao@example.com");
    await page.getByLabel("Celular (WhatsApp)").fill("(19) 99999-9999");
    await page.getByLabel("Crie uma senha").fill("Senha-Segura123");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Dados do circuito" })).toBeVisible();
    await page.getByRole("textbox", { name: "Circuito", exact: true }).fill("SP-17");
    await page.getByRole("textbox", { name: "Cidade", exact: true }).fill("Campinas");
    await page.getByRole("textbox", { name: "UF", exact: true }).fill("SP");
    /*
     * Clique no rotulo, nao `.check()` no campo: o `Checkbox` do design system
     * mantem o `input` real invisivel e desenha a caixa ao lado, entao o
     * Playwright recusa interagir com o campo — e e no rotulo que o usuario
     * clica de verdade.
     */
    await page.getByText(/Li e aceito os termos/).click();
    await expect(page.getByLabel(/Li e aceito os termos/)).toBeChecked();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Congregações do circuito" })).toBeVisible();
    await expect(page.getByText("Etapa 3 de 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar circuito" })).toBeVisible();

    // Duas voltas, atravessando a etapa 2: o formulario e um so, e o estado nao
    // mora nos campos que saem de tela.
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("textbox", { name: "Circuito", exact: true })).toHaveValue("SP-17");
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue("joao@example.com");
  });

  test("não avança com a etapa invalida", async ({ page }) => {
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Informe seu nome completo.")).toBeVisible();
    await expect(page.getByText("Etapa 1 de 3")).toBeVisible();
  });

  test("edita o celular no meio, cola e apaga sem prender o cursor na máscara", async ({ page }) => {
    const phone = page.getByRole("textbox", { name: "Celular (WhatsApp)", exact: true });
    await phone.fill("11977530630");
    await expect(phone).toHaveValue("(11) 97753-0630");

    // Troca um dígito no meio e continua digitando na mesma posição.
    await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(6, 7));
    await phone.pressSequentially("8");
    await expect(phone).toHaveValue("(11) 98753-0630");
    expect(await phone.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(7);

    // Backspace depois do hífen precisa apagar o dígito anterior de verdade.
    await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(11, 11));
    await phone.press("Backspace");
    await expect(phone).toHaveValue("(11) 9875-0630");
    expect(await phone.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(9);

    await phone.press("End");
    await phone.press("Backspace");
    await expect(phone).toHaveValue("(11) 9875-063");

    // Cola um número já formatado pela área de transferência real do navegador.
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText("(19) 99999-9999"));
    await phone.press("ControlOrMeta+A");
    await phone.press("ControlOrMeta+V");
    await expect(phone).toHaveValue("(19) 99999-9999");

    // Delete atravessa o fechamento do DDD e remove o próximo dígito.
    await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 3));
    await phone.press("Delete");
    await expect(phone).toHaveValue("(19) 9999-9999");
    await phone.press("End");
    for (let remaining = 10; remaining > 0; remaining -= 1) await phone.press("Backspace");
    await expect(phone).toHaveValue("");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`edita o circuito sem deslocar o cursor e exige aceite no tema ${theme}`, async ({
      page,
      context,
    }, testInfo) => {
      await context.addCookies([{ name: "suoac-theme", value: theme, url: E2E_BASE_URL }]);
      await page.reload();
      await page.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/i }).click();
      await page.getByLabel("Nome completo").fill("João Silva");
      await page.getByLabel("E-mail").fill("joao@example.com");
      await page.getByLabel("Celular (WhatsApp)").fill("19999999999");
      await page.getByLabel("Crie uma senha").fill("Senha-Segura123");
      await page.getByRole("button", { name: "Continuar" }).click();

      const circuit = page.getByRole("textbox", { name: "Circuito", exact: true });
      await circuit.fill("sp-019 a");
      await expect(circuit).toHaveValue("SP-019 A");
      await circuit.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 4));
      await circuit.pressSequentially("b");
      await expect(circuit).toHaveValue("SP-B19 A");
      expect(await circuit.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(4);
      await circuit.press("Backspace");
      await expect(circuit).toHaveValue("SP-19 A");
      expect(await circuit.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(3);
      await circuit.pressSequentially("0");
      await expect(circuit).toHaveValue("SP-019 A");

      const city = page.getByRole("textbox", { name: "Cidade", exact: true });
      await city.fill("São Paulo");
      const state = page.getByRole("textbox", { name: "UF", exact: true });
      await state.fill("s1");
      await expect(page.getByText("A UF tem duas letras.")).toBeVisible();
      await state.fill("sp");
      await expect(state).toHaveValue("SP");
      await expect(page.getByText("A UF tem duas letras.")).toBeHidden();
      await expect(page.getByRole("group", { name: "Seu privilégio" })).toContainText(
        "Coordenador do arranjo de ônibus no circuito",
      );
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByText("Aceite os termos para continuar.")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Dados do circuito" })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`circuito-${theme}.png`), fullPage: true });

      // Consultar a política em outra aba mantém os dados e não constitui aceite.
      const popupPromise = page.waitForEvent("popup");
      await page.getByRole("link", { name: "política de privacidade" }).click();
      const popup = await popupPromise;
      await expect(popup.getByRole("heading", { name: "Privacidade", exact: true })).toBeVisible();
      await popup.close();
      await expect(circuit).toHaveValue("SP-019 A");
      await expect(page.getByRole("checkbox")).not.toBeChecked();
      await page.getByText(/Li e aceito os termos/).click();
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("heading", { name: "Congregações do circuito" })).toBeVisible();
      await page.getByRole("button", { name: "Voltar", exact: true }).click();
      await expect(circuit).toHaveValue("SP-019 A");
      await expect(city).toHaveValue("São Paulo");
      await expect(state).toHaveValue("SP");
      await expect(page.getByRole("checkbox")).toBeChecked();
    });

    test(`orienta a criação da senha e valida sem sair do campo no tema ${theme}`, async ({
      page,
      context,
    }, testInfo) => {
      await context.addCookies([{ name: "suoac-theme", value: theme, url: E2E_BASE_URL }]);
      await page.reload();
      await page.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/i }).click();
      const email = page.getByRole("textbox", { name: "E-mail", exact: true });
      await email.fill("joao@");
      await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
      await expect(email).toBeFocused();
      await email.fill("joao@example.com");
      await expect(page.getByText("Informe um e-mail válido.")).toBeHidden();

      const password = page.getByLabel("Crie uma senha", { exact: true });
      await password.fill("Senha-123aa");
      await expect(page.getByText("A senha deve conter no mínimo 12 caracteres.")).toBeVisible();
      await expect(page.getByRole("status")).toContainText("quase lá");
      const requirements = page.getByRole("list", { name: "Requisitos da senha" });
      await expect(requirements.getByText(/12 ou mais caracteres/)).toContainText("pendente");
      await password.fill("Senha-Segura123");
      await expect(page.getByRole("status")).toContainText("forte");
      await expect(requirements.getByText(/12 ou mais caracteres/)).toContainText("cumprido");
      await page.getByRole("button", { name: "Mostrar senha" }).click();
      await expect(password).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Ocultar senha" }).click();
      await expect(password).toHaveAttribute("type", "password");
      await page.screenshot({ path: testInfo.outputPath(`coordenador-${theme}.png`), fullPage: true });
    });
  }
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
