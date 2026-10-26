import { defineConfig, devices, type Project } from "@playwright/test";

import {
  E2E_API_BASE_URL,
  E2E_API_PORT,
  E2E_BASE_URL,
  E2E_FLAGS_SECRET,
  E2E_PORT,
  E2E_SESSION_SECRET,
} from "./tests/e2e/support/environment";

/**
 * Testes end-to-end do SUOAC.
 *
 * Cobrem o que `jsdom` nao alcanca: navegacao real, cookies, Content-Security-Policy,
 * renderizacao no servidor e o tema aplicado antes da primeira pintura.
 *
 * Nao entram em `yarn run check`. O check e rodado a cada mudanca e precisa ser
 * rapido; subir navegador a cada vez transformaria a validacao em espera, e
 * validacao lenta acaba sendo pulada. No CI a suite roda em job proprio.
 *
 * A regressao visual (`*.visual.spec.ts`, SUC-42) e um projeto a parte, so
 * registrado com `PLAYWRIGHT_VISUAL=1`, que `scripts/test-visual.sh` define dentro
 * do contêiner. Fora dele a baseline nao casaria (fonte e plataforma), entao
 * `yarn test:e2e` nem a enxerga.
 */
const isVisualRun = process.env.PLAYWRIGHT_VISUAL === "1";

const visualProject: Project = {
  name: "visual",
  testMatch: "**/*.visual.spec.ts",
  use: { ...devices["Desktop Chrome"] },
  /*
   * So aqui, e nao na config global: o que vale para a baseline nao pode
   * vazar para um `toHaveScreenshot` de spec funcional, que rodaria fora
   * do contêiner. Sem plataforma no nome do arquivo, porque so existe um
   * ambiente de captura. Tolerancia zero de proposito: no mesmo ambiente
   * a captura e deterministica, e qualquer pixel diferente e mudanca de
   * aparencia. Afrouxar so com caso concreto.
   */
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixels: 0, threshold: 0 },
  },
};

export default defineConfig({
  testDir: "./tests/e2e",
  // Teste intermitente e bug: investigar, nao mascarar com repeticao.
  retries: 0,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: E2E_BASE_URL,
    // Guardados so quando algo falha: em suite verde nao servem para nada.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      testIgnore: "**/*.visual.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        // Largura minima do redesign. Ver .claude/rules/ui-e-design-system.md.
        viewport: { width: 1280, height: 900 },
      },
    },
    ...(isVisualRun ? [visualProject] : []),
  ],

  webServer: [
    {
      command: "node tests/e2e/support/mock-api-server.mjs",
      url: `${E2E_API_BASE_URL}/health`,
      reuseExistingServer: !process.env.CI,
      env: { E2E_API_PORT: String(E2E_API_PORT) },
    },
    {
      /*
       * Build de producao, nao `next dev`: o alvo do E2E e o que vai ao ar.
       * O modo de desenvolvimento difere em CSP, em cache e no tempo de resposta,
       * e testar nele daria uma confianca que o deploy nao sustenta.
       */
      command: `yarn build && yarn start --port ${E2E_PORT}`,
      url: E2E_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        // Server Actions usam a API local para que o E2E nunca dependa de staging.
        API_BASE_URL: E2E_API_BASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET ?? E2E_SESSION_SECRET,
        /*
         * Com o que o teste assina overrides de flag — e o que torna o valor de cada
         * flag deterministico, em vez de depender do que esta configurado na Vercel.
         * Ver `support/feature-flags.ts`.
         *
         * A chave `FLAGS` nao e mexida: anula-la quebraria o build, porque o adapter
         * cria o client no escopo do modulo e rejeita chave invalida ali, antes de
         * qualquer `defaultValue` poder socorrer.
         */
        FLAGS_SECRET: E2E_FLAGS_SECRET,
      },
    },
  ],
});
