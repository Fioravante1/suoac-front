export const themeTokens = {
  color: {
    primary: "#1F6E5A",
    primaryDark: "#174E40",
    primaryLight: "#E6F4EF",
    onPrimary: "#FFFFFF",
    info: "#2F6FED",
    success: "#2E9E5B",
    attention: "#F5B700",
    attentionText: "#8A6D00",
    critical: "#D64545",
    criticalDark: "#B53232",
    background: "#F7F9F8",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F3",
    border: "#E3E8E6",
    borderStrong: "#CFD8D4",
    textPrimary: "#1E1F24",
    textSecondary: "#667085",
    textInverse: "#FFFFFF",
    navy: "#0D2B45",
    sidebar: "#0D2B45",
    infoSoft: "#E8F0FF",
    successSoft: "#E7F6EE",
    attentionSoft: "#FFF4CF",
    criticalSoft: "#FDECEC",
    neutralSoft: "#F1F3F3",
    glass: "rgb(255 255 255 / 0.78)",
    scrim: "rgb(16 24 40 / 0.45)",
    modalScrim: "rgb(10 26 41 / 0.55)",
    overlay: "rgb(247 249 248 / 0.72)",
  },
  event: {
    open: "#1F6E5A",
    closed: "#F5B700",
    finished: "#0D2B45",
    draft: "#667085",
  },
  payment: {
    paid: "#2E9E5B",
    partial: "#F5B700",
    pending: "#D64545",
    exempt: "#2F6FED",
  },
  typography: {
    fontFamily:
      'var(--font-geist-sans), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: {
      label: "0.8125rem",
      small: "0.875rem",
      body: "1rem",
      h3: "1.25rem",
      h2: "1.5rem",
      h1: "2rem",
    },
    lineHeight: {
      tight: "1.2",
      heading: "1.25",
      body: "1.5",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  space: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    pill: "999px",
  },
  shadow: {
    xs: "0 1px 2px rgb(16 24 40 / 0.06)",
    sm: "0 8px 24px rgb(31 110 90 / 0.08)",
    md: "0 16px 40px rgb(31 110 90 / 0.12)",
    lg: "0 12px 28px rgb(16 24 40 / 0.18), 0 2px 6px rgb(16 24 40 / 0.12)",
    dropdown: "0 24px 60px rgb(13 43 69 / 0.28)",
    menu: "0 18px 40px rgb(13 43 69 / 0.2)",
    modal: "0 40px 100px rgb(10 26 41 / 0.45)",
    buttonPrimary: "0 6px 16px rgb(31 110 90 / 0.25)",
    buttonPrimaryStrong: "0 10px 24px rgb(31 110 90 / 0.28)",
  },
  overlay: {
    blur: "4px",
  },
  motion: {
    duration: {
      fast: "180ms",
      base: "200ms",
      medium: "300ms",
      slow: "400ms",
    },
    ease: {
      standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      overshoot: "cubic-bezier(0.3, 1.5, 0.5, 1)",
    },
    stagger: {
      step: "25ms",
      max: "400ms",
    },
  },
  zIndex: {
    dropdown: 50,
    modal: 100,
    toast: 120,
    overlay: 200,
  },
  layout: {
    mobileNavHeight: "4.5rem",
    sidebarWidth: "17rem",
    contentMaxWidth: "75rem",
  },
  component: {
    buttonHeight: "2.75rem",
    buttonHeightSm: "2.25rem",
    inputHeight: "3rem",
    cardPadding: "1.5rem",
  },
} as const;

export type ThemeTokens = typeof themeTokens;

/**
 * Valores que mudam entre tema claro e escuro.
 *
 * O tema escuro altera apenas cores e sombras — tipografia, espacamento, raio e
 * z-index sao os mesmos nos dois temas, e por isso nao se repetem aqui.
 *
 * Os tipos abaixo exigem a lista COMPLETA de cores e sombras: esquecer um token
 * ao adicionar outro quebra a compilacao em vez de produzir, em producao, um
 * elemento pintado com a cor do tema claro sobre fundo escuro.
 */
type ThemeColorTokens = Record<keyof ThemeTokens["color"], string>;
type ThemeShadowTokens = Record<keyof ThemeTokens["shadow"], string>;
type ThemeStateTokens<Group extends "event" | "payment"> = Record<keyof ThemeTokens[Group], string>;

export interface ThemeVariant {
  color: ThemeColorTokens;
  event: ThemeStateTokens<"event">;
  payment: ThemeStateTokens<"payment">;
  shadow: ThemeShadowTokens;
}

export const darkThemeTokens: ThemeVariant = {
  color: {
    primary: "#4FB393",
    primaryDark: "#7FCFB4",
    primaryLight: "#183229",
    onPrimary: "#0E1413",
    info: "#82A9FF",
    success: "#4CC07C",
    attention: "#F2C14B",
    attentionText: "#F2C14B",
    critical: "#F07272",
    criticalDark: "#F49A9A",
    background: "#0E1413",
    surface: "#151D1B",
    surfaceMuted: "#1C2623",
    border: "#25312E",
    borderStrong: "#34433F",
    textPrimary: "#E9EFED",
    textSecondary: "#9AA8A3",
    // Branco nos dois temas: usado sobre navy e sobre a cor primaria do tema claro.
    textInverse: "#FFFFFF",
    navy: "#0A1A29",
    sidebar: "#0A1A29",
    infoSoft: "#18233D",
    successSoft: "#163121",
    attentionSoft: "#342B10",
    criticalSoft: "#3A1D1D",
    neutralSoft: "#1C2623",
    glass: "rgb(21 29 27 / 0.78)",
    scrim: "rgb(0 0 0 / 0.6)",
    // O handoff define um unico scrim de modal, igual nos dois temas.
    modalScrim: "rgb(10 26 41 / 0.55)",
    overlay: "rgb(14 20 19 / 0.72)",
  },
  event: {
    open: "#4FB393",
    closed: "#F2C14B",
    finished: "#0A1A29",
    draft: "#9AA8A3",
  },
  payment: {
    paid: "#4CC07C",
    partial: "#F2C14B",
    pending: "#F07272",
    exempt: "#82A9FF",
  },
  shadow: {
    xs: "0 1px 2px rgb(0 0 0 / 0.3)",
    sm: "0 8px 24px rgb(0 0 0 / 0.25)",
    md: "0 16px 40px rgb(0 0 0 / 0.35)",
    lg: "0 12px 28px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.4)",
    dropdown: "0 24px 60px rgb(0 0 0 / 0.5)",
    menu: "0 18px 40px rgb(0 0 0 / 0.45)",
    modal: "0 40px 100px rgb(0 0 0 / 0.6)",
    buttonPrimary: "0 6px 16px rgb(0 0 0 / 0.35)",
    buttonPrimaryStrong: "0 10px 24px rgb(0 0 0 / 0.4)",
  },
};

/**
 * Tokens do tema claro no mesmo formato de `darkThemeTokens`, para quem precisa
 * comparar ou iterar os dois temas lado a lado.
 */
export const lightThemeTokens: ThemeVariant = {
  color: themeTokens.color,
  event: themeTokens.event,
  payment: themeTokens.payment,
  shadow: themeTokens.shadow,
};
