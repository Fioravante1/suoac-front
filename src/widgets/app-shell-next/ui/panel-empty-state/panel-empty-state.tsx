"use client";

import Link from "next/link";
import { CalendarPlus, Plus } from "lucide-react";

import { circuitSummaryOptions } from "@/entities/circuit";
import { eventSelectOptions } from "@/entities/event";
import { useQuery } from "@/shared/api";
import { useAuthPermissions } from "@/shared/auth";
import { routes } from "@/shared/config";
import { pluralize } from "@/shared/lib";
import { Skeleton } from "@/shared/ui/skeleton";

import { selectPastEvents } from "../../model";
import { ComingSoonButton } from "../coming-soon-button";

import styles from "./panel-empty-state.module.css";

/**
 * Circuito sem evento atual: orienta a criar o próximo, lista o histórico real e
 * resume congregações, coordenadores e convites. Duplicação aguarda SUC-99.
 */
export function PanelEmptyState() {
  const { userCircuitId } = useAuthPermissions();
  const summary = useQuery(circuitSummaryOptions(userCircuitId));
  const events = useQuery({ ...eventSelectOptions(userCircuitId), throwOnError: false });
  const previous = selectPastEvents(events.data?.data ?? []);
  const count = summary.data?.activeCongregationCount;
  const summaryDescription = summary.data
    ? [
        `${summary.data.activeCongregationCount} ${pluralize(summary.data.activeCongregationCount, "congregação", "congregações")}`,
        `${summary.data.activeCoordinatorCount} ${pluralize(summary.data.activeCoordinatorCount, "coordenador ativo", "coordenadores ativos")}`,
        `${summary.data.pendingInvitationCount} ${pluralize(summary.data.pendingInvitationCount, "convite pendente", "convites pendentes")}`,
      ].join(" · ")
    : null;

  return (
    <section className={styles.layout} aria-label="Circuito sem evento">
      <div className={styles.hero}>
        <span className={styles.icon}>
          <CalendarPlus size={26} aria-hidden="true" />
        </span>
        <h1>Nenhum evento em andamento</h1>
        <p>
          Crie o próximo congresso ou assembleia. Ao publicar, os coordenadores
          {count !== undefined &&
            ` ${count === 1 ? "da" : "das"} ${count} ${pluralize(count, "congregação", "congregações")}`}{" "}
          podem começar a inscrever os passageiros.
        </p>
        <div className={styles.actions}>
          <Link className={styles.create} href={routes.events}>
            <Plus size={16} aria-hidden="true" />
            Criar evento
          </Link>
          {previous.length > 0 && <ComingSoonButton label="Duplicar o último" variant="navy-outline" />}
        </div>
      </div>
      <div className={styles.right}>
        <section className={styles.past} aria-label="Eventos anteriores">
          <h2>Eventos anteriores</h2>
          {events.isPending && <Skeleton className={styles.skeleton} />}
          {events.isError && (
            <p>
              Não foi possível carregar os eventos.{" "}
              <button type="button" onClick={() => void events.refetch()}>
                Tentar de novo
              </button>
            </p>
          )}
          {events.isSuccess && previous.length === 0 && <p>Nenhum evento anterior registrado.</p>}
          {previous.map(({ event, monthShort, yearShort, subtitle }) => (
            <div className={styles.row} key={event.id}>
              <span className={styles.date}>
                <span>{monthShort}</span>
                <strong>{yearShort}</strong>
              </span>
              <span className={styles.event}>
                <strong>{event.title}</strong>
                <small>{subtitle}</small>
              </span>
              <ComingSoonButton label="Duplicar" variant="compact" />
            </div>
          ))}
          <div className={styles.desktopSummary}>
            {summary.isPending && <Skeleton className={styles.skeleton} />}
            {summaryDescription && <p>{summaryDescription}</p>}
            {summary.isError && (
              <p>
                Resumo do circuito indisponível.{" "}
                <button type="button" onClick={() => void summary.refetch()}>
                  Tentar de novo
                </button>
              </p>
            )}
          </div>
        </section>
        <section className={styles.compactSummary} aria-label="Resumo do circuito">
          <h2>Circuito pronto para o próximo evento</h2>
          {summary.isPending && <Skeleton className={styles.skeleton} />}
          {summaryDescription && <p>{summaryDescription}</p>}
          {summary.isError && (
            <p>
              Resumo do circuito indisponível.{" "}
              <button type="button" onClick={() => void summary.refetch()}>
                Tentar de novo
              </button>
            </p>
          )}
          <Link href={routes.congregations}>Ver convites</Link>
        </section>
      </div>
    </section>
  );
}
