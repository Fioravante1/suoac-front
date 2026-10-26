import { expect, test, type Page } from "@playwright/test";

import { E2E_BASE_URL } from "./support/environment";

/**
 * Regressao visual da tela de entrada (SUC-42), nos dois temas e nas tres
 * larguras do responsivo (SUC-83).
 *
 * Roda so pelo contêiner (`yarn test:visual`): ver `scripts/test-visual.sh` e a
 * secao de regressao visual do README. Funcional e visual sao projetos separados
 * de proposito — o que o E2E funcional ja cobre nao se repete aqui, e o que muda
 * so de aparencia so aparece aqui.
 *
 * As larguras sao as de uso real, uma por faixa: celular (abaixo de 760px),
 * tablet retrato (760px a 1023px) e desktop (1024px em diante).
 */
const THEMES = ["light", "dark"] as const;

const VIEWPORTS = [
  { name: "celular", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

/**
 * Forca o carregamento das imagens `loading="lazy"` e espera decodifica-las.
 *
 * Numa captura de pagina inteira o Playwright redimensiona a janela, o que
 * dispara o carregamento tardio no meio da captura: duas capturas seguidas
 * diferem em alguns pixels e `toHaveScreenshot` nunca estabiliza (a marca do
 * painel, no celular).
 */
async function settleImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = [...document.images];

    images.forEach((image) => {
      image.loading = "eager";
    });
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  });
}

/**
 * Estica a janela ate a altura do conteudo, em vez de usar `fullPage`.
 *
 * A captura de pagina inteira do Playwright redimensiona a janela no meio da
 * captura, e no celular, em que o conteudo passa da altura da tela, duas capturas
 * seguidas diferiam em dezenas de pixels (bordas dos campos) e a baseline nunca
 * estabilizava. Com a janela ja na altura final nada se mexe durante a captura.
 */
async function fitViewportToContent(page: Page, width: number): Promise<void> {
  const measureHeight = () => page.evaluate(() => document.documentElement.scrollHeight);

  await page.setViewportSize({ width, height: await measureHeight() });
  // Segunda medida: com `100dvh` e centralizacao o conteudo se reflui ao crescer a
  // janela, e a primeira altura pode nao ser a final.
  await page.setViewportSize({ width, height: await measureHeight() });
}

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    test(`tela de entrada, tema ${theme}, ${viewport.name}`, async ({ page, context }) => {
      await context.addCookies([{ name: "suoac-theme", value: theme, url: E2E_BASE_URL }]);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto("/login");
      await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
      // Fonte carregada antes da captura: texto trocado de fonte e a diferenca
      // mais comum entre duas execucoes.
      await page.evaluate(() => document.fonts.ready);
      await settleImages(page);
      await fitViewportToContent(page, viewport.width);

      await expect(page).toHaveScreenshot(`login-${theme}-${viewport.name}.png`);
    });
  }
}
