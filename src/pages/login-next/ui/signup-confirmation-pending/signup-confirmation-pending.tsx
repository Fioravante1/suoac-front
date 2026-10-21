import { Mail } from "lucide-react";

import styles from "./signup-confirmation-pending.module.css";

interface SignupConfirmationPendingProps {
  /** E-mail para onde a API mandou o código de confirmação. */
  email: string;
  onBackToSignIn: () => void;
}

/**
 * Destino do envio do autocadastro: avisa que o código saiu e para onde.
 *
 * É o lugar da tela de confirmação por código de 6 dígitos (SUC-32), que ainda
 * não existe. Quando ela chegar, substitui este componente no `AuthFlow` — o
 * `email` já vem aqui porque a confirmação precisa dele
 * (`POST /auth/circuit-signups/confirmations` recebe e-mail e código).
 */
export function SignupConfirmationPending({ email, onBackToSignIn }: SignupConfirmationPendingProps) {
  return (
    <section className={styles.screen} aria-labelledby="signup-confirmation-title" role="status">
      <span className={styles.icon} aria-hidden>
        <Mail size={28} strokeWidth={1.9} />
      </span>
      <div className={styles.text}>
        <h2 id="signup-confirmation-title" className={styles.title}>
          Confira seu e-mail
        </h2>
        <p className={styles.subtitle}>
          Enviamos um código de 6 dígitos para <strong>{email}</strong>. Verifique também a caixa de spam.
        </p>
      </div>
      <button type="button" className={styles.secondary} onClick={onBackToSignIn}>
        Voltar para o login
      </button>
    </section>
  );
}
