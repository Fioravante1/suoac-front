import { Check } from "lucide-react";

import styles from "./invitation-declined.module.css";

interface InvitationDeclinedProps {
  /** Quem enviou o convite: o back o avisa da recusa por e-mail. */
  invitedBy: string;
}

/**
 * Confirmacao da recusa (SUC-69). Termina em si mesma: nao ha saida, porque
 * quem recusou nao tem conta nem para onde ir — fecha a pagina.
 */
export function InvitationDeclined({ invitedBy }: InvitationDeclinedProps) {
  return (
    <section className={styles.confirmation} aria-labelledby="invitation-declined-title">
      <span className={styles.icon} aria-hidden>
        <Check size={30} strokeWidth={2.2} />
      </span>

      <div className={styles.text}>
        <h2 id="invitation-declined-title" className={styles.title}>
          Convite recusado
        </h2>
        <p className={styles.subtitle}>Avisamos {invitedBy}. Você pode fechar esta página.</p>
      </div>
    </section>
  );
}
