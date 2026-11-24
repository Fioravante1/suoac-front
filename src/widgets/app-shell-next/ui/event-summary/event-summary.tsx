"use client";

import { useId } from "react";
import { Banknote, Clock, MapPin } from "lucide-react";

import { Skeleton } from "@/shared/ui/skeleton";

import { useEventOverview } from "../../model";
import { EnrollPassengerButton } from "../enroll-passenger-button";
import { EventStatusPill } from "../event-status-pill";
import { EventTabs } from "../event-tabs";
import { EventTimeline } from "../event-timeline";
import { RegistrationsToggle } from "../registrations-toggle";

import styles from "./event-summary.module.css";

/**
 * Resumo do evento no desktop, sob a faixa (`SUOAC Dashboard v3.dc.html`, a partir de 1280px):
 * status, tipo, título, local, horários e valor, as ações, a faixa de datas com a linha de
 * etapas e as abas do painel.
 *
 * Mostra o evento selecionado na faixa, publicado: inscrições abertas, encerradas ou
 * finalizado. Rascunho e cancelado têm outro resumo (SUC-111). Com as inscrições abertas, as
 * ações são Encerrar inscrições e Cadastrar passageiro; encerradas antes do prazo, Reabrir
 * inscrições.
 *
 * Ações e abas são as do circuito. Os papéis da congregação veem o resumo e as etapas, e as
 * abas e ações deles chegam com o SUC-113.
 *
 * Precisa do `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function EventSummary() {
  const state = useEventOverview();
  const titleId = useId();

  if (state.status === "loading") {
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

  if (state.status === "hidden") return null;

  const { event, overview, isCircuitUser, canEnroll, registrationAction } = state;
  const { summary, timeline } = overview;

  return (
    <section className={styles.summary} aria-labelledby={titleId}>
      <div className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.kicker}>
            <EventStatusPill status={event.status} />
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
          <RegistrationsToggle event={event} action={registrationAction} />
          {canEnroll && <EnrollPassengerButton event={event} />}
        </div>
      </div>

      <EventTimeline summary={summary} timeline={timeline} />

      {isCircuitUser && <EventTabs eventId={event.id} circuitId={event.circuitId} />}
    </section>
  );
}
