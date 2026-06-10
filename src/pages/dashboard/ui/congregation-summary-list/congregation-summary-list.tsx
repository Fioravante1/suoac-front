import { Building2 } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { calcPercentage, formatCurrency } from "@/shared/lib";

import type { DashboardCongregationSummary } from "../../model";

import styles from "./congregation-summary-list.module.css";

interface CongregationSummaryListProps {
  summaries: DashboardCongregationSummary[];
}

const STATUS_LABELS: Record<DashboardCongregationSummary["paymentStatus"], string> = {
  paid: "Pago",
  partial: "Parcial",
  pending: "Pendente",
};

const STATUS_VARIANTS: Record<DashboardCongregationSummary["paymentStatus"], "success" | "attention" | "critical"> = {
  paid: "success",
  partial: "attention",
  pending: "critical",
};

const STATUS_COLORS: Record<DashboardCongregationSummary["paymentStatus"], string> = {
  paid: "var(--suoac-color-success)",
  partial: "var(--suoac-color-attention)",
  pending: "var(--suoac-color-critical)",
};

function getPaymentProgress(congregation: DashboardCongregationSummary): number {
  return Math.min(100, calcPercentage(Number(congregation.totalReceived), Number(congregation.totalExpected)));
}

export function CongregationSummaryList({ summaries }: CongregationSummaryListProps) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <Card className={styles.card}>
      <h4 className={styles.title}>Congregacoes</h4>
      <ul className={styles.list}>
        {summaries.map((congregation) => (
          <li key={congregation.id} className={styles.item}>
            <div className={styles.congregationInfo}>
              <div className={styles.nameRow}>
                <Building2 size={14} className={styles.icon} />
                <span className={styles.name}>{congregation.name}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.passengers}>
                  {congregation.totalPassengers} passageiro{congregation.totalPassengers !== 1 ? "s" : ""}
                </span>
                <div className={styles.progressBar} aria-hidden="true">
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${getPaymentProgress(congregation)}%`,
                      backgroundColor: STATUS_COLORS[congregation.paymentStatus],
                    }}
                  />
                </div>
              </div>
            </div>
            <div className={styles.financialInfo}>
              <div className={styles.amounts}>
                <span className={styles.received}>{formatCurrency(congregation.totalReceived)}</span>
                <span className={styles.expected}>de {formatCurrency(congregation.totalExpected)}</span>
              </div>
              <Badge variant={STATUS_VARIANTS[congregation.paymentStatus]}>
                {STATUS_LABELS[congregation.paymentStatus]}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
