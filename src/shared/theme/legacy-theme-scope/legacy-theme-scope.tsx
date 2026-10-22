import type { ReactNode } from "react";

import styles from "./legacy-theme-scope.module.css";

interface LegacyThemeScopeProps {
  children: ReactNode;
}

/**
 * Trava no tema claro tudo o que estiver dentro dele.
 *
 * CRIADO EM 09/10/2026 — TEMPORARIO. Envolve as telas que ainda nao foram
 * redesenhadas, para que a escolha do tema escuro nao as pinte antes de terem
 * contraste verificado. Conforme cada fatia do redesign e cortada, o escopo
 * desce de nivel ou sai; o componente e o CSS somem na Fatia 10 (card SUC-14).
 *
 * Nao use em tela nova: o redesign nasce com os dois temas.
 */
export function LegacyThemeScope({ children }: LegacyThemeScopeProps) {
  return <div className={styles.scope}>{children}</div>;
}
