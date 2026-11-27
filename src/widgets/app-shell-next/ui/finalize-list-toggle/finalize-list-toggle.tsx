"use client";

import { useId } from "react";
import { CONGREGATION_LIST_STATUSES, type CongregationListStatus } from "@/entities/congregation";
import { useToggleCongregationListStatus } from "@/features/finalize-congregation-list";
import { useAuthPermissions } from "@/shared/auth";
import { useToast } from "@/shared/ui/toast";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./finalize-list-toggle.module.css";

const REASON = "Apenas o coordenador do arranjo de ônibus na congregação finaliza ou reabre a lista.";

/** Uma ação compartilhada pelos resumos, com explicação acessível para o assistente. */
export function FinalizeListToggle({
  eventId,
  status,
  isStatusError = false,
  onRetry,
}: Readonly<{
  eventId: string;
  status: CongregationListStatus | null;
  isStatusError?: boolean;
  onRetry?: () => void;
}>) {
  const { userCongregationId, isCongregationAssistant } = useAuthPermissions();
  const { toggle, isUpdating } = useToggleCongregationListStatus(eventId, userCongregationId ?? "");
  const toast = useToast();
  const reasonId = useId();
  const isFinalized = status === CONGREGATION_LIST_STATUSES.FINALIZED;
  const isUnavailable = !status || !userCongregationId;
  const isStatusFailed = !isCongregationAssistant && isUnavailable && isStatusError;
  const isStatusLoading = !isCongregationAssistant && isUnavailable && !isStatusError;
  function handleClick() {
    if (isCongregationAssistant) {
      toast.info(REASON);
      return;
    }
    if (isUpdating || isUnavailable) return;
    toggle(isFinalized ? CONGREGATION_LIST_STATUSES.PENDING : CONGREGATION_LIST_STATUSES.FINALIZED);
  }
  return (
    <div className={styles.control}>
      <button
        type="button"
        className={styles.button}
        data-assistant={isCongregationAssistant || undefined}
        data-busy={isUpdating || undefined}
        aria-disabled={isCongregationAssistant || isUpdating || isUnavailable || undefined}
        aria-busy={isUpdating || undefined}
        aria-describedby={isCongregationAssistant || isUnavailable ? reasonId : undefined}
        onClick={handleClick}
      >
        {!isUpdating && (isFinalized && !isCongregationAssistant ? "Reabrir lista" : "Finalizar lista")}
        {isUpdating && (isFinalized ? "Reabrindo…" : "Finalizando…")}
      </button>
      {isStatusFailed && (
        <span id={reasonId} className={styles.status}>
          Não foi possível carregar o status da lista.
          {onRetry && (
            <button type="button" className={styles.retry} onClick={onRetry}>
              Tentar de novo
            </button>
          )}
        </span>
      )}
      {isStatusLoading && (
        <span id={reasonId}>
          <VisuallyHidden>Carregando o status da lista.</VisuallyHidden>
        </span>
      )}
      {isCongregationAssistant && (
        <span id={reasonId}>
          <VisuallyHidden>{REASON}</VisuallyHidden>
        </span>
      )}
    </div>
  );
}
