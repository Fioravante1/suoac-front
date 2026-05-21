import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "pages", pattern: "src/pages/*/**", capture: ["slice"] },
        { type: "widgets", pattern: "src/widgets/*/**", capture: ["slice"] },
        { type: "features", pattern: "src/features/*/**", capture: ["slice"] },
        { type: "entities", pattern: "src/entities/*/**", capture: ["slice"] },
        { type: "shared", pattern: "src/shared/*/**", capture: ["segment"] },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: { type: "app" },
              allow: { to: { type: ["app", "pages", "widgets", "features", "entities", "shared"] } },
            },
            {
              from: { type: "pages" },
              allow: { to: { type: ["widgets", "features", "entities", "shared"] } },
            },
            {
              from: { type: "widgets" },
              allow: { to: { type: ["features", "entities", "shared"] } },
            },
            {
              from: { type: "features" },
              allow: { to: { type: ["entities", "shared"] } },
            },
            {
              from: { type: "entities" },
              allow: { to: { type: ["shared"] } },
            },
            {
              from: { type: "shared" },
              disallow: { to: { type: ["app", "pages", "widgets", "features", "entities"] } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/error.tsx", "app/global-error.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project/generated artifacts:
    "coverage/**",
    "dist/**",
    "node_modules/**",
    "*.tsbuildinfo",
  ]),
]);

export default eslintConfig;
