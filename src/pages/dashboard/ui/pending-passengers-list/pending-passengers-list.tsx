import { CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

import { PAYMENT_STATUS_BADGE_VARIANTS, PAYMENT_STATUS_LABELS } from "@/entities/event-passenger";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { routes } from "@/shared/config";
import { formatCurrency } from "@/shared/lib";

import type { DashboardPendingPassenger } from "../../model";

import styles from "./pending-passengers-list.module.css";

interface PendingPassengersListProps {
  passengers: DashboardPendingPassenger[];
  totalPendingPassengers: number;
  eventId: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PendingPassengersList({ passengers, totalPendingPassengers, eventId }: PendingPassengersListProps) {
  if (passengers.length === 0) {
    return (
      <Card className={styles.card}>
        <h4 className={styles.title}>Passageiros pendentes</h4>
        <div className={styles.emptyState}>
          <CheckCircle size={32} className={styles.emptyIcon} />
          <p className={styles.emptyMessage}>Todos os passageiros estao em dia!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <h4 className={styles.title}>Passageiros pendentes</h4>
      <ul className={styles.list}>
        {passengers.map((passenger) => (
          <li key={passenger.id} className={styles.item}>
            <span className={styles.avatar} aria-hidden="true">
              {getInitials(passenger.passengerName)}
            </span>
            <div className={styles.passengerInfo}>
              <span className={styles.passengerName}>{passenger.passengerName}</span>
              <span className={styles.passengerAmount}>{formatCurrency(passenger.pendingAmount)}</span>
            </div>
            <div className={styles.passengerMeta}>
              <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[passenger.paymentStatus]}>
                {PAYMENT_STATUS_LABELS[passenger.paymentStatus]}
              </Badge>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </li>
        ))}
      </ul>
      {totalPendingPassengers > passengers.length && (
        <Link href={routes.eventDetail(eventId)} className={styles.viewAll}>
          Ver todos ({totalPendingPassengers})
        </Link>
      )}
    </Card>
  );
}
