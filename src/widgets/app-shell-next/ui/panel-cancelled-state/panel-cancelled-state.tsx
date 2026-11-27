"use client";

import { Ban } from "lucide-react";

import type { Event } from "@/entities/event";
import { financialSummaryOptions } from "@/entities/event-passenger";
import { useQuery } from "@/shared/api";
import { formatCurrencyCompact, pluralize } from "@/shared/lib";
import { Skeleton } from "@/shared/ui/skeleton";

import { formatCancellationHeader } from "../../model";
import { ComingSoonButton } from "../coming-soon-button";

import styles from "./panel-cancelled-state.module.css";

/**
 * Evento cancelado com efeitos e resumo financeiro real. Devoluções e exportação
 * aguardam SUC-100, sem simular valores ou progresso de restituição.
 */
export function PanelCancelledState({ event }: Readonly<{ event: Event }>) {
  const financial = useQuery({ ...financialSummaryOptions(event.id), throwOnError: false });
  const header = formatCancellationHeader(event);
  const totals = financial.data?.totals;
  const congregations =
    financial.data?.congregations.filter((item) => item.totalPassengers > 0 || Number(item.totalReceived) > 0) ?? [];
  const paidCount = (totals?.byStatus.paid ?? 0) + (totals?.byStatus.partial ?? 0);
  const kpis = [
    {
      label: "Passageiros afetados",
      value: totals?.totalPassengers,
      subtitle: `em ${congregations.length} ${pluralize(congregations.length, "congregação", "congregações")}`,
      tone: "normal",
      available: true,
    },
    {
      label: "A devolver",
      value: totals ? formatCurrencyCompact(totals.totalReceived) : undefined,
      subtitle: `${paidCount} com pagamento`,
      tone: "critical",
      available: true,
    },
    { label: "Já devolvido", value: "—", subtitle: "Em breve", tone: "success", available: false },
    { label: "Congregações quitadas", value: "—", subtitle: "Em breve", tone: "normal", available: false },
  ];

  return (
    <section className={styles.layout} aria-label="Evento cancelado">
      <div className={styles.banner}>
        <span className={styles.icon}>
          <Ban size={22} aria-hidden="true" />
        </span>
        <div className={styles.message}>
          <div className={styles.compact}>
            <h1>{header.compactTitle}</h1>
            <p>{header.compactSubtitle}</p>
          </div>
          <div className={styles.desktop}>
            <h1>{header.desktopTitle}</h1>
            <p>{header.desktopSubtitle}</p>
          </div>
        </div>
        <div className={styles.compact}>
          <ComingSoonButton label="Duplicar como novo" />
        </div>
      </div>
      {financial.isError && (
        <p role="alert">
          Não foi possível carregar o resumo financeiro.{" "}
          <button type="button" onClick={() => void financial.refetch()}>
            Tentar de novo
          </button>
        </p>
      )}
      <div className={styles.kpis}>
        {kpis.map((kpi) => (
          <div className={styles.kpi} key={kpi.label}>
            <span>{kpi.label}</span>
            {financial.isPending && kpi.available && <Skeleton className={styles.skeleton} />}
            {(!financial.isPending || !kpi.available) && (
              <>
                <strong data-tone={kpi.tone}>{kpi.value ?? "—"}</strong>
                <small>{totals || !kpi.available ? kpi.subtitle : "Resumo indisponível"}</small>
              </>
            )}
          </div>
        ))}
      </div>
      <section className={styles.refunds} aria-label="Devoluções por congregação">
        <header>
          <h2>Devoluções por congregação</h2>
          <ComingSoonButton label="Exportar lista" />
        </header>
        {financial.isPending && <Skeleton className={styles.skeleton} />}
        {financial.isSuccess && congregations.length === 0 && <p>Nenhuma congregação com pagamentos registrados.</p>}
        {congregations.map((item) => (
          <div className={styles.row} key={item.congregationId}>
            <span>
              <strong>{item.congregationName}</strong>
              <small>
                {item.totalPassengers} {pluralize(item.totalPassengers, "passageiro")} ·{" "}
                {formatCurrencyCompact(item.totalReceived)}
              </small>
            </span>
            <span className={styles.badge}>Controle de devoluções em breve</span>
          </div>
        ))}
      </section>
    </section>
  );
}
