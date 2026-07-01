import { Building2 } from "lucide-react";

import type { CongregationFinancial } from "@/entities/event-passenger";
import { calcPercentage, formatCurrency } from "@/shared/lib";
import { Card } from "@/shared/ui/card";

import styles from "./congregation-financial-list.module.css";

interface CongregationFinancialListProps {
  congregations: CongregationFinancial[];
}

/** Ordena por valor pendente decrescente: quem deve mais aparece primeiro. */
function sortByPendingDesc(congregations: CongregationFinancial[]): CongregationFinancial[] {
  return [...congregations].sort((a, b) => Number(b.totalPending) - Number(a.totalPending));
}

export function CongregationFinancialList({ congregations }: CongregationFinancialListProps) {
  if (congregations.length === 0) return null;

  const ordered = sortByPendingDesc(congregations);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Building2 size={18} aria-hidden="true" />
        <h3 className={styles.title}>Resumo por congregação</h3>
      </div>

      <ul className={styles.list}>
        {ordered.map((congregation) => {
          const receivedPercentage = calcPercentage(
            Number(congregation.totalReceived),
            Number(congregation.totalExpected),
          );
          const hasPending = Number(congregation.totalPending) > 0;

          return (
            <li key={congregation.congregationId} className={styles.row}>
              <div className={styles.rowTop}>
                <span className={styles.name}>{congregation.congregationName}</span>
                <span className={styles.passengers}>{congregation.totalPassengers} inscritos</span>
              </div>

              <div className={styles.track}>
                <span className={styles.fill} style={{ width: `${receivedPercentage}%` }} />
              </div>

              <div className={styles.amounts}>
                <span className={styles.received}>{formatCurrency(congregation.totalReceived)} recebido</span>
                <span className={styles.expected}>de {formatCurrency(congregation.totalExpected)}</span>
                <span className={hasPending ? styles.pending : styles.settled}>
                  {hasPending ? `${formatCurrency(congregation.totalPending)} pendente` : "Quitado"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
