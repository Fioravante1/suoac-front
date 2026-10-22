import type { ReactNode } from "react";

import { AuthPanel } from "../auth-panel";
import { BrandPanel } from "../brand-panel";

import styles from "./auth-shell.module.css";

interface AuthShellProps {
  /** Tela de acesso ativa, renderizada na coluna da direita. */
  children: ReactNode;
}

/**
 * Moldura completa das telas de acesso: apresentacao a esquerda, tela ativa a
 * direita.
 *
 * O grid mora aqui, e nao em cada pagina, porque era a ultima peca do layout
 * dividido que cada tela teria de repetir — e e a peca que define a proporcao
 * entre as colunas.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={styles.page}>
      <BrandPanel />
      <AuthPanel>{children}</AuthPanel>
    </div>
  );
}
