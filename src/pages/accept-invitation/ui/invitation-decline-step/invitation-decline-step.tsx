"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { formatDate } from "@/shared/lib";

import { DECLINE_REASONS, DECLINE_REASON_LABELS, type DeclineReason } from "../../model";

import styles from "./invitation-decline-step.module.css";

interface InvitationDeclineStepProps {
  invitedBy: string;
  congregation: string;
  /** Validade do convite, ISO 8601: sem a recusa disponivel, e o que resta a quem nao quer aceitar. */
  expiresAt: string;
  onBack: () => void;
}

interface DeclineFormValues {
  reason: DeclineReason | null;
}

const REASONS = Object.values(DECLINE_REASONS);

/**
 * Recusa do convite: o convidado escolhe um motivo e confirma.
 *
 * A tela e a do desenho, mas o back ainda nao recebe a recusa (SUC-68). Ate o
 * endpoint existir, confirmar nao finge sucesso: explica que ainda nao esta
 * disponivel e que ignorar o convite resolve, porque ele expira sozinho. O
 * SUC-69 troca isso pela chamada real.
 */
export function InvitationDeclineStep({ invitedBy, congregation, expiresAt, onBack }: InvitationDeclineStepProps) {
  const [isUnavailable, setIsUnavailable] = useState(false);
  const { register, handleSubmit, control } = useForm<DeclineFormValues>({ defaultValues: { reason: null } });
  // `useWatch` em vez de `watch()`: o React Compiler nao memoiza o retorno de `watch`.
  const hasReason = useWatch({ control, name: "reason" }) !== null;

  return (
    <form
      className={styles.decline}
      onSubmit={handleSubmit(() => setIsUnavailable(true))}
      aria-labelledby="invitation-decline-title"
    >
      <header className={styles.header}>
        <h2 id="invitation-decline-title" className={styles.title}>
          Recusar convite?
        </h2>
        <p className={styles.subtitle}>
          {invitedBy} poderá convidar outra pessoa para a {congregation}.
        </p>
      </header>

      <fieldset className={styles.reasons}>
        <legend className={styles.legend}>Motivo da recusa</legend>
        {REASONS.map((reason) => (
          <label key={reason} className={styles.reason}>
            <input type="radio" value={reason} className={styles.input} {...register("reason")} />
            <span className={styles.radio} aria-hidden />
            {DECLINE_REASON_LABELS[reason]}
          </label>
        ))}
      </fieldset>

      {isUnavailable && (
        <p className={styles.unavailable} role="alert">
          <CircleAlert size={17} strokeWidth={2} aria-hidden />
          <span>
            Recusar convite ainda não está disponível. Basta ignorar esta mensagem: o convite expira em{" "}
            {formatDate(expiresAt)}. Se preferir, avise {invitedBy}.
          </span>
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.back} onClick={onBack}>
          Voltar
        </button>
        <button type="submit" className={styles.confirm} disabled={!hasReason}>
          Recusar
        </button>
      </div>
    </form>
  );
}
