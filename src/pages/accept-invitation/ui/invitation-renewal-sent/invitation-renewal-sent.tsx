import { Check } from "lucide-react";

import styles from "./invitation-renewal-sent.module.css";

interface InvitationRenewalSentProps {
  /** Quem enviou o convite e recebeu o pedido; `null` quando o back nao mandou o contexto do convite expirado. */
  invitedBy: string | null;
  /** E-mail do convite, para onde o novo link vai quando o coordenador reenviar; `null` como acima. */
  email: string | null;
}

/**
 * Confirmacao do pedido de novo convite (SUC-76). Termina em si mesma: nao ha
 * saida, porque o proximo passo e do coordenador do circuito.
 *
 * Diz que o pedido chegou, nao que um link foi enviado: o back so avisa quem
 * convidou, que decide se reenvia.
 */
export function InvitationRenewalSent({ invitedBy, email }: InvitationRenewalSentProps) {
  const recipient = invitedBy ?? "Quem convidou você";
  const destination = email ? `em ${email}` : "no e-mail do convite";

  return (
    <section className={styles.confirmation} aria-labelledby="invitation-renewal-sent-title">
      <span className={styles.icon} aria-hidden>
        <Check size={30} strokeWidth={2.2} />
      </span>

      <div className={styles.text}>
        <h2 id="invitation-renewal-sent-title" className={styles.title}>
          Pedido enviado
        </h2>
        <p className={styles.subtitle}>
          {recipient} recebeu seu pedido. Um novo link chegará {destination}.
        </p>
      </div>
    </section>
  );
}
