import { expect, test, type APIRequestContext } from "@playwright/test";

import { E2E_API_BASE_URL, E2E_BASE_URL } from "./support/environment";
import { overrideFlags } from "./support/feature-flags";

/**
 * A rota `/reset-password`, aberta pelo link do e-mail (SUC-26).
 *
 * Nao repete o que o teste unitario cobre — os textos de cada estado e a
 * validacao do formulario estao la. O que so existe aqui e a rota real: a
 * verificacao do token acontecendo no servidor antes da primeira pintura, o
 * corpo que sai de fato para a API, e a independencia da flag do redesign.
 *
 * O estado do token vem do proprio valor dele na API local — ver
 * `support/mock-api-server.mjs`.
 *
 * `getByLabel` com `exact: true` nos campos de senha: por substring, "Nova senha"
 * casaria tambem o titulo ("Crie uma nova senha") e a confirmacao ("Confirme a
 * nova senha"). O Playwright, diferente do Testing Library, casa por substring
 * por padrao.
 */
interface ResetRecebido {
  body: Record<string, unknown>;
  requestUrl: string;
}

/**
 * O que a API local recebeu para um token, ou `undefined` se nada chegou.
 *
 * Filtra pelo token em vez de olhar o ultimo registro porque a suite roda em
 * paralelo contra o mesmo servidor: o token e o que identifica o teste. Por isso
 * tambem nenhum teste limpa o registro — apagaria o do vizinho.
 */
async function resetRecebidoPor(request: APIRequestContext, token: string): Promise<ResetRecebido | undefined> {
  const resposta = await request.get(`${E2E_API_BASE_URL}/__resets`);
  expect(resposta.ok()).toBe(true);
  const { passwordResets } = (await resposta.json()) as { passwordResets: ResetRecebido[] };

  return passwordResets.find((registro) => registro.body.token === token);
}

test.describe("rota de redefinicao de senha", () => {
  test("mostra o formulario quando o token do link e valido", async ({ page }) => {
    await page.goto("/reset-password?token=token-valido");

    await expect(page).toHaveURL(`${E2E_BASE_URL}/reset-password?token=token-valido`);
    await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeVisible();
  });

  test("redefine a senha e envia o token no corpo, nunca na query string", async ({ page, request }) => {
    await page.goto("/reset-password?token=token-valido");
    await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByLabel("Confirme a nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByRole("heading", { name: "Senha alterada" })).toBeVisible();
    await expect(page.getByText(/as outras sessões foram encerradas/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir para a entrada" })).toHaveAttribute("href", "/login");

    // A confirmacao e uma rota propria, sem o token: ele ja foi consumido e nao
    // deve ficar no endereco nem no historico do navegador.
    await expect(page).toHaveURL(/\/reset-password\?status=sucesso$/);

    const enviado = await resetRecebidoPor(request, "token-valido");

    expect(enviado?.body).toEqual({ token: "token-valido", newPassword: "NovaSenha@123" });
    // A confirmacao e assunto do formulario, nao da API.
    expect(enviado?.body).not.toHaveProperty("confirmPassword");
    // Sem query string nenhuma: o token iria para log de acesso e `Referer`.
    expect(enviado?.requestUrl).toBe("/auth/password-resets");
  });

  test("explica o link expirado e oferece pedir outro, sem pedir senha", async ({ page }) => {
    await page.goto("/reset-password?token=token-expirado");

    await expect(page.getByRole("heading", { name: "Este link expirou" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pedir um novo link" })).toHaveAttribute("href", "/login");
    // O ponto do endpoint de verificacao: nao pedir a senha duas vezes para
    // depois recusar.
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeHidden();
  });

  test("recusa link ja utilizado", async ({ page }) => {
    await page.goto("/reset-password?token=token-usado");

    await expect(page.getByRole("heading", { name: "Este link já foi usado" })).toBeVisible();
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeHidden();
  });

  test("trata token desconhecido e link sem token como invalidos", async ({ page }) => {
    await page.goto("/reset-password?token=token-invalido");
    await expect(page.getByRole("heading", { name: "Este link não é válido" })).toBeVisible();

    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Este link não é válido" })).toBeVisible();
  });

  test("nao culpa o link quando a verificacao falha no servidor", async ({ page }) => {
    await page.goto("/reset-password?token=token-instavel");

    await expect(page.getByRole("heading", { name: "Não foi possível verificar o link" })).toBeVisible();
    await expect(page.getByText(/ele continua valendo/)).toBeVisible();
    // Mandar pedir outro link aqui faria a pessoa descartar um link que serve.
    await expect(page.getByRole("link", { name: "Pedir um novo link" })).toBeHidden();
  });

  test("nao envia senha fora da politica para a API", async ({ page, request }) => {
    await page.goto("/reset-password?token=token-politica");
    await page.getByLabel("Nova senha", { exact: true }).fill("senhalongaaaa");
    await page.getByLabel("Confirme a nova senha", { exact: true }).fill("senhalongaaaa");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByText(/ao menos uma letra maiúscula/)).toBeVisible();

    // Nada chegou a API com este token: a politica barrou antes do envio.
    expect(await resetRecebidoPor(request, "token-politica")).toBeUndefined();
  });

  test("troca o formulario pelo aviso quando o token morre antes do envio", async ({ page }) => {
    /*
     * O token passa na verificacao de abertura e e recusado no envio. E o caso
     * real de quem deixa a aba aberta: o link vence, ou e usado em outro
     * dispositivo, entre abrir a tela e salvar.
     */
    await page.goto("/reset-password?token=token-vence-na-aba");

    await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();

    await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByLabel("Confirme a nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByRole("heading", { name: "Este link expirou" })).toBeVisible();
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeHidden();
    // A senha digitada nao e perdida em silencio: a tela diz o que aconteceu e
    // oferece pedir outro link, em vez de so limpar os campos.
    await expect(page.getByRole("link", { name: "Pedir um novo link" })).toBeVisible();
  });

  test("ignora a URL alterada depois de a tela abrir", async ({ page, request }) => {
    await page.goto("/reset-password?token=token-nao-relido");
    await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByLabel("Confirme a nova senha", { exact: true }).fill("NovaSenha@123");

    await page.evaluate(() => {
      window.history.replaceState(null, "", "/reset-password?token=token-usado");
    });
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByRole("heading", { name: "Senha alterada" })).toBeVisible();

    // O token vem do servidor na primeira pintura e nao e relido da URL: trocar
    // a query string depois nao muda o que e enviado.
    expect(await resetRecebidoPor(request, "token-nao-relido")).toBeDefined();
    expect(await resetRecebidoPor(request, "token-usado")).toBeUndefined();
  });

  test("mantem a tela de sucesso depois de o token ser consumido", async ({ page }) => {
    /*
     * Contra o backend real, redefinir grava `usedAt` e a verificacao seguinte
     * do mesmo token responde `409`. Se algo fizer a rota renderizar de novo
     * depois do envio — e escrita de cookie numa Server Action faz —, a pagina
     * reavaliaria o token ja gasto e trocaria o sucesso por "link ja usado",
     * bem na cara de quem acabou de redefinir com exito.
     */
    await page.goto("/reset-password?token=token-consumivel");

    await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByLabel("Confirme a nova senha", { exact: true }).fill("NovaSenha@123");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByRole("heading", { name: "Senha alterada" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Este link já foi usado" })).toBeHidden();
  });

  test("nao e indexada por robo de busca", async ({ page }) => {
    await page.goto("/reset-password?token=token-valido");

    // A URL carrega um token de uso unico: nada aqui deve entrar em indice.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("nao deixa o token sair no cabecalho Referer", async ({ page }) => {
    const response = await page.goto("/reset-password?token=token-valido");

    /*
     * O token esta na URL por contrato — o backend monta o link do e-mail
     * assim. Com a politica geral do app, requisicao de mesma origem levaria a
     * URL inteira no `Referer`, e todo chunk de `/_next/static` desta pagina e
     * de mesma origem: o token entraria no log de acesso.
     */
    expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  });
});

test.describe("independencia da flag do redesign", () => {
  test("continua servindo a tela com REDESIGN_LOGIN desligada", async ({ page, context }) => {
    await overrideFlags(context, { REDESIGN_LOGIN: false });

    await page.goto("/reset-password?token=token-valido");

    /*
     * O link chega por e-mail e sobrevive a troca de flag. Se esta rota fosse
     * gateada junto com `/login`, desligar a flag depois do envio transformaria
     * link valido em 404 — ver a decisao registrada no SUC-26.
     */
    await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();
  });
});
