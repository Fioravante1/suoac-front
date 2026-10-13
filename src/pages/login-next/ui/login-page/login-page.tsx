import { AuthPanel } from "../auth-panel";
import { BrandPanel } from "../brand-panel";

import styles from "./login-page.module.css";

/**
 * Tela de entrada redesenhada (Fatia 1 do redesign).
 *
 * Nasce desligada: nenhuma rota aponta para ca ainda. A ligacao acontece na
 * fachada de `app/(auth)/login/page.tsx`, atras da flag `REDESIGN_LOGIN` — ver
 * `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` §2.
 *
 * Este slice nunca importa de `@/pages/login`, e vice-versa: qualquer
 * dependencia entre os dois impediria o corte limpo do legado.
 */
export function LoginPage() {
  return (
    <div className={styles.page}>
      <BrandPanel />
      <AuthPanel />
    </div>
  );
}
