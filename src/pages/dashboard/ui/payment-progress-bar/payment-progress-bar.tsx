import { PAYMENT_STATUS_LABELS } from "@/entities/event-passenger";
import { Card } from "@/shared/ui/card";

import type { DashboardPaymentBreakdown } from "../../model";
import { totalFromBreakdown } from "../../model";

import styles from "./payment-progress-bar.module.css";

interface PaymentProgressBarProps {
  breakdown: DashboardPaymentBreakdown;
}

const SEGMENTS: { key: keyof DashboardPaymentBreakdown; label: string; cssClass: string }[] = [
  { key: "paid", label: PAYMENT_STATUS_LABELS.PAID, cssClass: "paid" },
  { key: "partial", label: PAYMENT_STATUS_LABELS.PARTIAL, cssClass: "partial" },
  { key: "pending", label: PAYMENT_STATUS_LABELS.PENDING, cssClass: "pending" },
  { key: "exempt", label: PAYMENT_STATUS_LABELS.EXEMPT, cssClass: "exempt" },
];

export function PaymentProgressBar({ breakdown }: PaymentProgressBarProps) {
  const total = totalFromBreakdown(breakdown);

  if (total === 0) return null;

  const paidPercentage = Math.round(((breakdown.paid + breakdown.exempt) / total) * 100);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>Pagamentos</h4>
        <span className={styles.percentage}>{paidPercentage}% quitado</span>
      </div>

      <div className={styles.barContainer}>
        {SEGMENTS.map(({ key, cssClass }) => {
          const value = breakdown[key];

          if (value === 0) return null;

          const widthPercent = (value / total) * 100;

          return (
            <div
              key={key}
              className={`${styles.barSegment} ${styles[cssClass]}`}
              style={{ width: `${widthPercent}%` }}
              role="meter"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${PAYMENT_STATUS_LABELS[key.toUpperCase() as keyof typeof PAYMENT_STATUS_LABELS]}: ${value}`}
            />
          );
        })}
      </div>

      <div className={styles.legend}>
        {SEGMENTS.map(({ key, label, cssClass }) => (
          <div key={key} className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles[cssClass]}`} />
            <span className={styles.legendLabel}>
              {label}: {breakdown[key]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
