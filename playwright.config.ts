import { defineConfig, devices } from "@playwright/test";

/**
 * Testes end-to-end do SUOAC.
 *
 * Cobrem o que `jsdom` nao alcanca: navegacao real, cookies, Content-Security-Policy,
 * renderizacao no servidor e o tema aplicado antes da primeira pintura.
 *
 * Nao entram em `yarn run check`. O check e rodado a cada mudanca e precisa ser
 * rapido; subir navegador a cada vez transformaria a validacao em espera, e
 * validacao lenta acaba sendo pulada. No CI a suite roda em job proprio.
 */
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Teste intermitente e bug: investigar, nao mascarar com repeticao.
  retries: 0,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    // Guardados so quando algo falha: em suite verde nao servem para nada.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Largura minima do redesign. Ver AGENTS.md §6.
        viewport: { width: 1280, height: 900 },
      },
    },
  ],

  webServer: {
    /*
     * Build de producao, nao `next dev`: o alvo do E2E e o que vai ao ar.
     * O modo de desenvolvimento difere em CSP, em cache e no tempo de resposta,
     * e testar nele daria uma confianca que o deploy nao sustenta.
     */
    command: `yarn build && yarn start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // A suite atual nao chama a API: exercita tela, navegacao e tema. Quando um
      // teste precisar de dados, a estrategia de mock entra aqui.
      API_BASE_URL: process.env.API_BASE_URL ?? "https://placeholder.invalid",
      SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-session-secret-sem-valor-real",
    },
  },
});
