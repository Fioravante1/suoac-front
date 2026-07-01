"use client";

import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_COUNT_KEYS,
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
  type PaymentStatusCounts,
} from "@/entities/event-passenger";

import styles from "./payment-status-filter.module.css";

/** `"ALL"` representa o filtro "Todos" (sem filtro de status). */
export type PaymentStatusFilterValue = PaymentStatus | "ALL";

interface PaymentStatusFilterProps {
  value: PaymentStatusFilterValue;
  onChange: (value: PaymentStatusFilterValue) => void;
  counts: PaymentStatusCounts;
  total: number;
}

const STATUS_ORDER: PaymentStatus[] = [
  PAYMENT_STATUSES.PENDING,
  PAYMENT_STATUSES.PARTIAL,
  PAYMENT_STATUSES.PAID,
  PAYMENT_STATUSES.EXEMPT,
];

export function PaymentStatusFilter({ value, onChange, counts, total }: PaymentStatusFilterProps) {
  const chips: { key: PaymentStatusFilterValue; label: string; count: number }[] = [
    { key: "ALL", label: "Todos", count: total },
    ...STATUS_ORDER.map((status) => ({
      key: status,
      label: PAYMENT_STATUS_LABELS[status],
      count: counts[PAYMENT_STATUS_COUNT_KEYS[status]],
    })),
  ];

  return (
    <div className={styles.filter} role="group" aria-label="Filtrar por status de pagamento">
      {chips.map((chip) => {
        const isActive = chip.key === value;

        return (
          <button
            key={chip.key}
            type="button"
            className={`${styles.chip} ${isActive ? styles.active : ""}`.trim()}
            aria-pressed={isActive}
            onClick={() => onChange(chip.key)}
          >
            {chip.label}
            <span className={styles.count}>{chip.count}</span>
          </button>
        );
      })}
    </div>
  );
}
