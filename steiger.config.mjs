import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // The project is intentionally scaffolded before all slices are consumed.
      "fsd/insignificant-slice": "off",
    },
  },
  {
    // Next.js server/client boundary prevents barrel-exporting server-only
    // modules alongside client code. These files import server modules directly.
    files: [
      "src/**/api/*-action.ts",
      "src/**/api/*.queries.ts",
      "src/**/api/**/*-query.ts",
      // Proxies server-only consumidos por Route Handlers (ex.: exportação de PDF). Importam
      // módulos server-only (`http-client`, `session`) diretamente pela mesma razão das actions.
      "src/**/api/**/*-response.ts",
      "src/**/api/**/*-response.test.ts",
      "src/app/providers/**",
      "src/pages/**/ui/**",
    ],
    rules: {
      "fsd/no-public-api-sidestep": "off",
    },
  },
]);
