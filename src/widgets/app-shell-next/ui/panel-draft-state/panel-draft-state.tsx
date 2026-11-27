"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { circuitSummaryOptions } from "@/entities/circuit";
import type { Event } from "@/entities/event";
import { usePublishEvent } from "@/features/event/publish-event";
import { useQuery } from "@/shared/api";
import { routes } from "@/shared/config";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { buildDraftChecklist, getDraftEventDescription, ON_PUBLISH_STEPS } from "../../model";
import { ComingSoonButton } from "../coming-soon-button";

import styles from "./panel-draft-state.module.css";

/**
 * Checklist e orientação de publicação do rascunho. O desktop publica pelo hero;
 * celular e tablet mostram as ações no próprio card, mantendo as falhas visíveis.
 */
export function PanelDraftState({ event }: Readonly<{ event: Event }>) {
  const summary = useQuery(circuitSummaryOptions(event.circuitId));
  const checklist = buildDraftChecklist(event, summary.data?.activeCongregationCount);
  const description = getDraftEventDescription(event);
  const { publish, isPublishing, error } = usePublishEvent(event.id);

  return (
    <section className={styles.layout} aria-label="Evento em rascunho">
      <div className={styles.checklist}>
        <div className={styles.compact}>
          <div className={styles.kicker}>
            <span>Rascunho</span> só você vê este evento
          </div>
          <h1>{event.title}</h1>
          <p>{description}</p>
        </div>
        <div className={styles.desktop}>
          <h2>Falta pouco para publicar</h2>
          <p>Enquanto for rascunho, só você vê este evento.</p>
        </div>
        <div className={styles.progressLabel}>
          <span className={styles.compact}>
            {checklist.readyCount} de {checklist.totalCount} itens prontos
          </span>
          <span className={styles.desktop}>
            {checklist.readyCount} de {checklist.totalCount} prontos
          </span>
          <span className={styles.compact}>{checklist.percent}%</span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Itens prontos para publicar"
          aria-valuenow={checklist.readyCount}
          aria-valuemin={0}
          aria-valuemax={checklist.totalCount}
        >
          <span style={{ width: `${checklist.percent}%` }} />
        </div>
        <ul className={styles.items}>
          {checklist.items.map((item) => (
            <li key={item.id}>
              <span className={styles.check} data-done={item.isDone || undefined}>
                <VisuallyHidden>{item.isDone ? "Pronto" : "Pendente"}</VisuallyHidden>
                {item.isDone && <Check size={12} strokeWidth={3.5} aria-hidden="true" />}
              </span>
              <span className={styles.item}>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
              {!item.isDone && item.action.kind === "link" && (
                <Link className={styles.edit} href={item.action.href}>
                  {item.action.label}
                </Link>
              )}
              {!item.isDone && item.action.kind === "coming-soon" && (
                <ComingSoonButton label={item.action.label} variant="compact" />
              )}
            </li>
          ))}
        </ul>
        {summary.isError && (
          <p>
            Não foi possível conferir as congregações.{" "}
            <button type="button" onClick={() => void summary.refetch()}>
              Tentar de novo
            </button>
          </p>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Link className={styles.edit} href={routes.eventDetail(event.id)}>
            Editar evento
          </Link>
          <button
            className={styles.publish}
            type="button"
            onClick={publish}
            disabled={isPublishing}
            aria-busy={isPublishing}
          >
            {isPublishing ? "Publicando…" : "Publicar e abrir inscrições"}
          </button>
        </div>
        <p className={styles.note}>
          Dá para publicar sem ônibus: as congregações inscrevem e as poltronas são distribuídas quando você cadastrar
          os ônibus.
        </p>
      </div>
      <aside className={styles.next}>
        <h2>Ao publicar</h2>
        <ol>
          {ON_PUBLISH_STEPS.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
