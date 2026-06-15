import type { PaymentStatus } from "@/entities/event-passenger";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/entities/event-passenger";
import { Card } from "@/shared/ui/card";
import { calcPercentage } from "@/shared/lib";

import type { DashboardPaymentBreakdown } from "../../model";
import { totalFromBreakdown } from "../../model";

import styles from "./payment-progress-bar.module.css";

interface PaymentProgressBarProps {
  breakdown: DashboardPaymentBreakdown;
}

interface Segment {
  key: keyof DashboardPaymentBreakdown;
  status: PaymentStatus;
}

function breakdownKey(status: PaymentStatus): keyof DashboardPaymentBreakdown {
  return status.toLowerCase() as keyof DashboardPaymentBreakdown;
}

const SEGMENTS: Segment[] = [
  { key: breakdownKey(PAYMENT_STATUSES.PAID), status: PAYMENT_STATUSES.PAID },
  { key: breakdownKey(PAYMENT_STATUSES.PARTIAL), status: PAYMENT_STATUSES.PARTIAL },
  { key: breakdownKey(PAYMENT_STATUSES.PENDING), status: PAYMENT_STATUSES.PENDING },
  { key: breakdownKey(PAYMENT_STATUSES.EXEMPT), status: PAYMENT_STATUSES.EXEMPT },
];

export function PaymentProgressBar({ breakdown }: PaymentProgressBarProps) {
  const total = totalFromBreakdown(breakdown);

  if (total === 0) return null;

  const settled = breakdown.paid + breakdown.exempt;
  const paidPercentage = calcPercentage(settled, total);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>Pagamentos</h4>
        <span className={styles.percentage}>{paidPercentage}% quitado</span>
      </div>

      <div className={styles.barContainer}>
        {SEGMENTS.map(({ key, status }, index) => {
          const value = breakdown[key];

          if (value === 0) return null;

          return (
            <div
              key={key}
              className={styles.segment}
              style={{ width: `${(value / total) * 100}%` }}
              data-label={`${PAYMENT_STATUS_LABELS[status]}: ${value}`}
            >
              <span
                className={`${styles.barSegment} ${styles[key]}`}
                style={{ animationDelay: `${index * 100}ms` }}
                role="meter"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${PAYMENT_STATUS_LABELS[status]}: ${value}`}
              />
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        {SEGMENTS.map(({ key, status }) => (
          <div key={key} className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles[key]}`} />
            <span className={styles.legendLabel}>
              {PAYMENT_STATUS_LABELS[status]}: {breakdown[key]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
