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
]);
