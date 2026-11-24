"use client";

import { Lock } from "lucide-react";

import { congregationEventStatusesOptions, countUnfinalizedCongregations } from "@/entities/congregation";
import { getEventToday, type Event } from "@/entities/event";
import { eventPassengerListOptions } from "@/entities/event-passenger";
import { useQuery } from "@/shared/api";
import { formatInteger, useServerError } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { ModalNext } from "@/shared/ui/modal-next";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { useCloseRegistrationsMutation } from "../../api";
import { describeCloseConsequences } from "../../model";

import styles from "./close-registrations-dialog.module.css";

const UNAVAILABLE_COUNT = "—";

type CloseRegistrationsDialogProps = Readonly<{
  event: Pick<Event, "id" | "registrationDeadline" | "days">;
  open: boolean;
  onClose: () => void;
}>;

/**
 * A confirmação de encerrar as inscrições antes do prazo: modal central no desktop
 * (`SUOAC Dashboard v3.dc.html`) e bottom sheet no celular (`SUOAC Dashboard Mobile.dc.html`).
 *
 * No desktop vêm o prazo, as consequências e duas contagens: as congregações que ainda não
 * finalizaram a lista e os passageiros inscritos. O celular tem só o texto curto do desenho.
 * A recusa da API fica na própria confirmação, e o evento é recarregado de todo jeito. Cada
 * contagem mostra um esqueleto enquanto carrega e, se falhar, fica com "—": não é motivo para
 * derrubar a tela.
 */
export function CloseRegistrationsDialog({ event, open, onClose }: CloseRegistrationsDialogProps) {
  const closeMutation = useCloseRegistrationsMutation(event.id);
  const { serverError, clearServerError, showServerError } = useServerError();
  const congregations = useQuery({
    ...congregationEventStatusesOptions(event.id),
    enabled: open,
    throwOnError: false,
  });
  const passengers = useQuery({ ...eventPassengerListOptions(event.id, 1), enabled: open, throwOnError: false });
  const consequences = describeCloseConsequences(event, getEventToday());
  const isClosing = closeMutation.isPending;

  const unfinalized = congregations.data
    ? `${countUnfinalizedCongregations(congregations.data)} de ${congregations.data.length}`
    : UNAVAILABLE_COUNT;
  const enrolled = passengers.data ? formatInteger(passengers.data.meta.total) : UNAVAILABLE_COUNT;
  const loadingCount = (
    <>
      <Skeleton className={styles.countBone} />
      <VisuallyHidden>Carregando</VisuallyHidden>
    </>
  );

  function handleClose() {
    if (isClosing) return;

    clearServerError();
    onClose();
  }

  async function handleConfirm() {
    clearServerError();

    const result = await closeMutation.mutateAsync();

    if (!result.success) {
      showServerError(result.error, "Não foi possível encerrar as inscrições.");
      return;
    }

    onClose();
  }

  return (
    <ModalNext
      open={open}
      onClose={handleClose}
      title="Encerrar inscrições agora?"
      variant="sheet"
      className={styles.modal}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isClosing}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isClosing} aria-busy={isClosing}>
            {isClosing && <Spinner size="small" />}
            {isClosing ? "Encerrando…" : "Encerrar inscrições"}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          <Lock size={22} strokeWidth={1.9} />
        </span>

        <p className={styles.description}>
          <span className={styles.full}>{consequences.full}</span>
          <span className={styles.compact}>{consequences.compact}</span>
        </p>

        <dl className={styles.counts}>
          <div className={styles.count}>
            <dt>Congregações que não finalizaram</dt>
            <dd>
              {congregations.isLoading && loadingCount}
              {!congregations.isLoading && unfinalized}
            </dd>
          </div>
          <div className={styles.count}>
            <dt>Passageiros inscritos</dt>
            <dd>
              {passengers.isLoading && loadingCount}
              {!passengers.isLoading && enrolled}
            </dd>
          </div>
        </dl>

        {serverError && (
          <p className={styles.error} role="alert">
            {serverError}
          </p>
        )}
      </div>
    </ModalNext>
  );
}
