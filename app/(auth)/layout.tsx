import type { ReactNode } from "react";

import styles from "./layout.module.css";

/**
 * Moldura das telas de acesso, comum as duas versoes de `/login`.
 *
 * Nao aplica contencao de tema: desde SUC-24 o escopo legado desceu para o ramo
 * antigo da fachada em `login/page.tsx`, porque daqui ele travaria no claro
 * tambem a tela redesenhada.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
