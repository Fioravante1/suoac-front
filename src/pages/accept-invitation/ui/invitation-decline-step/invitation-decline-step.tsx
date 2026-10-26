"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { useServerError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";

import { declineInvitationAction } from "../../api";
import { DECLINE_REASONS, DECLINE_REASON_LABELS, type DeclineReason, type InvitationRejection } from "../../model";

import styles from "./invitation-decline-step.module.css";

interface InvitationDeclineStepProps {
  /** Token do link, lido da URL no servidor. Nao e campo do formulario: a action o envia. */
  token: string;
  invitedBy: string;
  congregation: string;
  onBack: () => void;
  /** Recusa gravada: quem chama troca a tela pela confirmacao. */
  onDeclined: () => void;
  /** O convite deixou de servir entre abrir a tela e recusar: quem chama troca a tela pelo aviso. */
  onRejected: (rejection: InvitationRejection) => void;
}

interface DeclineFormValues {
  reason: DeclineReason | null;
}

const REASONS = Object.values(DECLINE_REASONS);
const SUBMIT_FAILED = "Não foi possível recusar o convite agora. Verifique sua conexão e tente novamente.";

/**
 * Recusa do convite (SUC-69): o convidado escolhe um motivo e confirma.
 *
 * Quem enviou o convite e avisado pelo back. Falha de rede ou do servico fica
 * na propria tela, com o motivo ja escolhido, para tentar de novo; so os
 * vereditos definitivos — usado, expirado, cancelado, ja recusado — trocam a
 * tela por um aviso.
 */
export function InvitationDeclineStep({
  token,
  invitedBy,
  congregation,
  onBack,
  onDeclined,
  onRejected,
}: InvitationDeclineStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { serverError, clearServerError, showServerError } = useServerError();
  const { register, handleSubmit, control } = useForm<DeclineFormValues>({ defaultValues: { reason: null } });
  // `useWatch` em vez de `watch()`: o React Compiler nao memoiza o retorno de `watch`.
  const reason = useWatch({ control, name: "reason" });

  async function submit(values: DeclineFormValues) {
    if (values.reason === null) {
      return;
    }

    clearServerError();
    setIsSubmitting(true);

    try {
      const result = await declineInvitationAction({ token, reason: values.reason });

      if (result.status === "declined") {
        onDeclined();
        return;
      }

      if (result.status === "rejected") {
        onRejected(result.rejection);
        return;
      }

      showServerError(result.message, SUBMIT_FAILED);
    } catch {
      // Falha antes de a action responder — conexao caida, deploy no meio da requisicao.
      showServerError(null, SUBMIT_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.decline} onSubmit={handleSubmit(submit)} aria-labelledby="invitation-decline-title">
      <header className={styles.header}>
        <h2 id="invitation-decline-title" className={styles.title}>
          Recusar convite?
        </h2>
        <p className={styles.subtitle}>
          {invitedBy} poderá convidar outra pessoa para a {congregation}.
        </p>
      </header>

      <fieldset className={styles.reasons} disabled={isSubmitting}>
        <legend className={styles.legend}>Motivo da recusa</legend>
        {REASONS.map((option) => (
          <label key={option} className={styles.reason}>
            <input type="radio" value={option} className={styles.input} {...register("reason")} />
            <span className={styles.radio} aria-hidden />
            {DECLINE_REASON_LABELS[option]}
          </label>
        ))}
      </fieldset>

      {serverError && (
        <p key={serverError} className={styles.error} role="alert">
          <CircleAlert size={17} strokeWidth={2} aria-hidden />
          <span>{serverError}</span>
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.back} onClick={onBack} disabled={isSubmitting}>
          Voltar
        </button>
        <button type="submit" className={styles.confirm} disabled={reason === null || isSubmitting}>
          {isSubmitting && <Spinner className={styles.spinner} size="small" />}
          {isSubmitting ? "Recusando…" : "Recusar"}
        </button>
      </div>
    </form>
  );
}
