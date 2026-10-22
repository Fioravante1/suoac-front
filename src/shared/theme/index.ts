// Public API client-safe do slice de tema.
// A leitura do cookie no servidor vive em `@/shared/theme/theme-cookie`, que e
// `server-only` e por isso nao pode ser reexportada aqui — mesmo padrao de
// `@/shared/auth` e `@/shared/auth/session`.
export { ThemeProvider, useTheme } from "./theme-context";
export { LegacyThemeScope } from "./legacy-theme-scope";
export { THEME_PREFERENCES, THEME_COOKIE_NAME, parseThemePreference } from "./theme-preference";
export type { ThemePreference, ResolvedTheme } from "./theme-preference";
