"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { routes } from "@/shared/config";
import { Skeleton } from "@/shared/ui/skeleton";

import { useEventOverview } from "../../model";
import { EventDayTiles } from "../event-day-tiles";
import { EventStepper } from "../event-stepper";
import { FinalizeListToggle } from "../finalize-list-toggle";
import { RegistrationsToggle } from "../registrations-toggle";

import styles from "./event-home-hero.module.css";

/**
 * O resumo do evento no celular e no tablet: o hero navy da tela Início
 * (`SUOAC Dashboard Mobile.dc.html`, abaixo de 1280px). Os dias com a contagem e o local, a
 * linha de etapas com rótulo curto, Encerrar ou Reabrir inscrições e Ver inscritos.
 *
 * Só aparece no Início: nas outras telas, o topo (SUC-110) basta. O título fica no seletor de
 * evento do topo, e Cadastrar passageiro é o botão flutuante da barra de baixo (SUC-110).
 * Encerrar e reabrir as inscrições são do circuito.
 *
 * Precisa do `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function EventHomeHero() {
  const pathname = usePathname();
  const state = useEventOverview();

  if (pathname !== routes.dashboard) return null;

  if (state.status === "loading") {
    return (
      <div className={styles.hero} role="status" aria-label="Carregando o resumo do evento">
        <Skeleton className={`${styles.bone} ${styles.boneWhen}`} />
        <Skeleton className={`${styles.bone} ${styles.boneSteps}`} />
        <Skeleton className={`${styles.bone} ${styles.boneActions}`} />
      </div>
    );
  }

  if (state.status === "hidden") return null;

  const { event, overview, registrationAction } = state;
  const { summary, timeline } = overview;
  const heading = summary.countdown ?? summary.months;

  return (
    <section
      className={styles.hero}
      data-assistant={state.isCongregationAssistant || undefined}
      aria-label={`Resumo de ${event.title}`}
    >
      <div className={styles.when}>
        <EventDayTiles tiles={summary.dayTiles} isCompact />
        <p className={styles.countdown}>
          {heading && <span className={styles.countdownHeading}>{heading}</span>}
          <span className={styles.location}>{summary.compactLocation}</span>
        </p>
      </div>

      <div className={styles.steps}>
        <EventStepper timeline={timeline} />
      </div>

      {state.isCongregationAssistant && (
        <p className={styles.assistantNote}>
          Você é assistente: cadastra passageiros e registra pagamentos. Finalizar a lista fica com o coordenador do
          arranjo de ônibus na congregação.
        </p>
      )}
      <div className={styles.actions} data-single={(!registrationAction && !state.canToggleListStatus) || undefined}>
        {state.isCircuitUser && <RegistrationsToggle event={event} action={registrationAction} />}
        {state.canToggleListStatus && (
          <FinalizeListToggle
            eventId={event.id}
            status={state.congregationListStatus}
            isStatusError={state.isCongregationListError}
            onRetry={state.retryCongregationList}
          />
        )}
        <Link href={routes.eventEnrollments(event.id)} className={styles.passengersLink}>
          Ver inscritos
          <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
