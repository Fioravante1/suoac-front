"use client";

import { useId } from "react";
import { Banknote, Clock, MapPin } from "lucide-react";

import { Skeleton } from "@/shared/ui/skeleton";

import { useSelectedEvent } from "@/features/select-event";
import { useAuthPermissions } from "@/shared/auth";
import { PANEL_MODES, resolvePanelMode, useEventOverview } from "../../model";
import { ComingSoonButton } from "../coming-soon-button";
import { PublishEventActions } from "../publish-event-actions";
import { EnrollPassengerButton } from "../enroll-passenger-button";
import { EventStatusPill } from "../event-status-pill";
import { EventTabs } from "../event-tabs";
import { EventTimeline } from "../event-timeline";
import { FinalizeListToggle } from "../finalize-list-toggle";
import { RegistrationsToggle } from "../registrations-toggle";

import styles from "./event-summary.module.css";

/**
 * Resumo do evento no desktop, sob a faixa (`SUOAC Dashboard v3.dc.html`, a partir de 1280px):
 * status, tipo, título, local, horários e valor, as ações, a faixa de datas com a linha de
 * etapas e as abas do painel.
 *
 * Mostra o evento selecionado na faixa, publicado: inscrições abertas, encerradas ou
 * finalizado. Rascunho e cancelado mostram só o hero, sem etapas nem abas. Com as inscrições abertas, as
 * ações são Encerrar inscrições e Cadastrar passageiro; encerradas antes do prazo, Reabrir
 * inscrições.
 *
 * Ações e abas seguem o papel: circuito gerencia inscrições, congregação gerencia a própria lista.
 *
 * Precisa do `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function EventSummary() {
  const state = useEventOverview({ includeInactive: true });
  const selection = useSelectedEvent();
  const { isCircuitUser } = useAuthPermissions();
  const event = selection?.event;
  const mode = resolvePanelMode(event, isCircuitUser);
  const titleId = useId();

  if (selection?.isLoading) {
    return (
      <div className={styles.summary} role="status" aria-label="Carregando o resumo do evento">
        <div className={styles.loading}>
          <Skeleton className={`${styles.bone} ${styles.bonePill}`} />
          <Skeleton className={`${styles.bone} ${styles.boneTitle}`} />
          <Skeleton className={`${styles.bone} ${styles.boneChips}`} />
          <Skeleton className={`${styles.bone} ${styles.boneTimeline}`} />
        </div>
      </div>
    );
  }

  if (!event || mode === PANEL_MODES.EMPTY || state.status !== "ready") return null;
  const { overview } = state;
  const { summary, timeline } = overview;
  const isLive = mode === PANEL_MODES.LIVE;
  const isDraft = mode === PANEL_MODES.DRAFT;
  const isCancelled = mode === PANEL_MODES.CANCELLED;
  const canEnroll = isLive && state.canEnroll;
  const action = state.registrationAction;

  return (
    <section className={styles.summary} aria-labelledby={titleId}>
      <div className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.kicker}>
            <EventStatusPill status={event.status} label={isDraft ? "Rascunho · só você vê" : undefined} />
            <span className={styles.type}>{summary.typeLabel}</span>
          </div>

          <h2 id={titleId} className={styles.title}>
            {event.title}
          </h2>

          <ul className={styles.chips} aria-label="Sobre o evento">
            <li className={styles.chip}>
              <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
              {summary.location}
            </li>
            {summary.schedule && (
              <li className={styles.chip}>
                <Clock size={15} strokeWidth={1.8} aria-hidden="true" />
                {summary.schedule}
              </li>
            )}
            <li className={styles.chip}>
              <Banknote size={15} strokeWidth={1.8} aria-hidden="true" />
              {summary.price}
            </li>
          </ul>
        </div>

        {/* Sempre montado, para a confirmação de encerrar seguir aberta mesmo que o evento
            recarregado já não ofereça ação; sem botões, o CSS some com o bloco. Sem Cadastrar
            passageiro, o Reabrir fica sozinho. */}
        <div className={styles.actions} data-single={!canEnroll || undefined}>
          {isLive && isCircuitUser && <RegistrationsToggle event={event} action={action} />}
          {isLive && state.canToggleListStatus && (
            <FinalizeListToggle
              eventId={event.id}
              status={state.congregationListStatus}
              isStatusError={state.isCongregationListError}
              onRetry={state.retryCongregationList}
            />
          )}
          {isDraft && isCircuitUser && <PublishEventActions key={event.id} eventId={event.id} />}
          {isCancelled && isCircuitUser && <ComingSoonButton label="Duplicar como novo" variant="navy-primary" />}
          {canEnroll && <EnrollPassengerButton event={event} />}
        </div>
      </div>

      {isLive && <EventTimeline summary={summary} timeline={timeline} />}

      {isLive && <EventTabs eventId={event.id} circuitId={event.circuitId} />}
    </section>
  );
}
