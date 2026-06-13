import { Spinner } from "@/shared/ui/spinner";

import styles from "./session-expired-overlay.module.css";

/**
 * Feedback de tela cheia exibido entre a detecção da sessão expirada e o
 * carregamento da página de login (hard navigation). Cobre a UI privada que,
 * nesse intervalo, estaria renderizada sem sessão.
 */
export function SessionExpiredOverlay() {
  return (
    <div className={styles.overlay} role="alert" aria-live="assertive">
      <Spinner size="large" />
      <p className={styles.title}>Sua sessão expirou</p>
      <p className={styles.subtitle}>Redirecionando para o login…</p>
    </div>
  );
}
