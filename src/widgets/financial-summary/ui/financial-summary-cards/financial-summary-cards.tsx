import { CheckCircle, Clock, Wallet } from "lucide-react";

import type { FinancialTotals } from "@/entities/event-passenger";
import { calcPercentage, formatCurrency } from "@/shared/lib";
import { Card } from "@/shared/ui/card";

import styles from "./financial-summary-cards.module.css";

interface FinancialSummaryCardsProps {
  totals: FinancialTotals;
}

export function FinancialSummaryCards({ totals }: FinancialSummaryCardsProps) {
  const hasPending = Number(totals.totalPending) > 0;
  const receivedPercentage = calcPercentage(Number(totals.totalReceived), Number(totals.totalExpected));

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>
            <Wallet size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatCurrency(totals.totalExpected)}</span>
            <span className={styles.statLabel}>Valor esperado</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.successIcon}`}>
            <CheckCircle size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={`${styles.statValue} ${styles.successValue}`}>{formatCurrency(totals.totalReceived)}</span>
            <span className={styles.statLabel}>Recebido</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${hasPending ? styles.criticalIcon : styles.successIcon}`}>
            <Clock size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={`${styles.statValue} ${hasPending ? styles.criticalValue : styles.successValue}`}>
              {formatCurrency(totals.totalPending)}
            </span>
            <span className={styles.statLabel}>Pendente</span>
          </div>
        </Card>
      </div>

      <Card className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressTitle}>Recebido</span>
          <span className={styles.progressValue}>{receivedPercentage}%</span>
        </div>
        <div className={styles.progressTrack}>
          <span
            className={styles.progressFill}
            style={{ width: `${receivedPercentage}%` }}
            role="meter"
            aria-valuenow={receivedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${receivedPercentage}% do valor esperado recebido`}
          />
        </div>
      </Card>
    </div>
  );
}
