import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: false,
    clearMocks: true,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage/vitest",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",
      ],
    },
  },
});
