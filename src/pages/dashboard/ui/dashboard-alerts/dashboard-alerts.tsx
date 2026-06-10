import type { ReactNode } from "react";

import { AlertTriangle, Clock } from "lucide-react";

import { formatCurrency } from "@/shared/lib";

import type { DashboardEvent } from "../../model";
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

export function DashboardAlerts({ event, totalPendingPassengers, totalPending }: DashboardAlertsProps) {
  const alerts: AlertItem[] = [];

  const regDays = daysUntilDeadline(event.registrationDeadline);
  const regUrgency = getDeadlineUrgency(regDays);

  if (regUrgency === DEADLINE_URGENCIES.expired) {
    alerts.push({
      icon: <AlertTriangle size={18} />,
      message: `O prazo de inscricao expirou ha ${Math.abs(regDays)} dia${Math.abs(regDays) !== 1 ? "s" : ""}.`,
      borderColor: DEADLINE_URGENCY_COLORS.expired,
    });
  } else if (regUrgency === DEADLINE_URGENCIES.urgent || regUrgency === DEADLINE_URGENCIES.approaching) {
    alerts.push({
      icon: <Clock size={18} />,
      message: `O prazo de inscricao encerra em ${regDays} dia${regDays !== 1 ? "s" : ""}.`,
      borderColor: DEADLINE_URGENCY_COLORS[regUrgency],
    });
  }

  const payDays = daysUntilDeadline(event.paymentDeadline);
  const payUrgency = getDeadlineUrgency(payDays);

  if (payUrgency === DEADLINE_URGENCIES.expired && totalPendingPassengers > 0) {
    alerts.push({
      icon: <AlertTriangle size={18} />,
      message: `O prazo de pagamento expirou. ${totalPendingPassengers} passageiro${totalPendingPassengers !== 1 ? "s" : ""} com ${formatCurrency(totalPending)} pendente${totalPendingPassengers !== 1 ? "s" : ""}.`,
      borderColor: DEADLINE_URGENCY_COLORS.expired,
    });
  } else if ((payUrgency === DEADLINE_URGENCIES.urgent || payUrgency === DEADLINE_URGENCIES.approaching) && totalPendingPassengers > 0) {
    alerts.push({
      icon: <Clock size={18} />,
      message: `O prazo de pagamento encerra em ${payDays} dia${payDays !== 1 ? "s" : ""}. ${totalPendingPassengers} passageiro${totalPendingPassengers !== 1 ? "s" : ""} ainda pendente${totalPendingPassengers !== 1 ? "s" : ""}.`,
      borderColor: DEADLINE_URGENCY_COLORS[payUrgency],
    });
  }

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
