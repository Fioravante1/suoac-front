import type { ReactNode } from "react";

import styles from "./layout.module.css";

/**
 * Moldura das telas de acesso.
 *
 * Nao aplica contencao de tema: as telas de acesso nascem com os dois temas, e
 * travadas no claro ignorariam o proprio seletor. A contencao fica so nas telas
 * ainda nao redesenhadas (`LegacyThemeScope`).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
