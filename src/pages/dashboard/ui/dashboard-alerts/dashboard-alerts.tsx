import type { ReactNode } from "react";

import { AlertTriangle, Clock } from "lucide-react";

import { formatCurrency } from "@/shared/lib";

import type { DashboardEvent, DeadlineUrgency } from "../../model";
import { daysUntilDeadline, getDeadlineUrgency, DEADLINE_URGENCIES, DEADLINE_URGENCY_COLORS } from "../../model";

import styles from "./dashboard-alerts.module.css";

interface DashboardAlertsProps {
  event: DashboardEvent;
  totalPendingPassengers: number;
  totalPending: string;
}

interface AlertItem {
  icon: ReactNode;
  message: string;
  borderColor: string;
}

function pluralize(count: number, singular: string): string {
  return count !== 1 ? `${singular}s` : singular;
}

function buildRegistrationAlert(days: number, urgency: DeadlineUrgency): AlertItem | null {
  if (urgency === DEADLINE_URGENCIES.expired) {
    return {
      icon: <AlertTriangle size={18} />,
      message: `O prazo de inscricao expirou ha ${Math.abs(days)} ${pluralize(Math.abs(days), "dia")}.`,
      borderColor: DEADLINE_URGENCY_COLORS.expired,
    };
  }

  if (urgency === DEADLINE_URGENCIES.urgent || urgency === DEADLINE_URGENCIES.approaching) {
    return {
      icon: <Clock size={18} />,
      message: `O prazo de inscricao encerra em ${days} ${pluralize(days, "dia")}.`,
      borderColor: DEADLINE_URGENCY_COLORS[urgency],
    };
  }

  return null;
}

function buildPaymentAlert(
  days: number,
  urgency: DeadlineUrgency,
  pendingCount: number,
  pendingAmount: string,
): AlertItem | null {
  if (pendingCount === 0) return null;

  if (urgency === DEADLINE_URGENCIES.expired) {
    return {
      icon: <AlertTriangle size={18} />,
      message: `O prazo de pagamento expirou. ${pendingCount} ${pluralize(pendingCount, "passageiro")} com ${formatCurrency(pendingAmount)} ${pluralize(pendingCount, "pendente")}.`,
      borderColor: DEADLINE_URGENCY_COLORS.expired,
    };
  }

  if (urgency === DEADLINE_URGENCIES.urgent || urgency === DEADLINE_URGENCIES.approaching) {
    return {
      icon: <Clock size={18} />,
      message: `O prazo de pagamento encerra em ${days} ${pluralize(days, "dia")}. ${pendingCount} ${pluralize(pendingCount, "passageiro")} ainda ${pluralize(pendingCount, "pendente")}.`,
      borderColor: DEADLINE_URGENCY_COLORS[urgency],
    };
  }

  return null;
}

export function DashboardAlerts({ event, totalPendingPassengers, totalPending }: DashboardAlertsProps) {
  const regDays = daysUntilDeadline(event.registrationDeadline);
  const payDays = daysUntilDeadline(event.paymentDeadline);

  const alerts = [
    buildRegistrationAlert(regDays, getDeadlineUrgency(regDays)),
    buildPaymentAlert(payDays, getDeadlineUrgency(payDays), totalPendingPassengers, totalPending),
  ].filter((alert): alert is AlertItem => alert !== null);

  if (alerts.length === 0) return null;

  return (
    <div className={styles.container}>
      {alerts.map((alert, index) => (
        <div key={index} className={styles.alert} style={{ borderLeftColor: alert.borderColor }}>
          <span className={styles.icon} style={{ color: alert.borderColor }}>
            {alert.icon}
          </span>
          <p className={styles.message}>{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
