"use client";

import { Wallet } from "lucide-react";

import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_BADGE_VARIANTS,
  PAYMENT_STATUS_LABELS,
  type EventPassenger,
} from "@/entities/event-passenger";
import { formatCurrency, subtractCurrency } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { DataTable, type ColumnDef } from "@/shared/ui/data-table";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";

import styles from "./financial-passengers-table.module.css";

interface FinancialPassengersTableProps {
  passengers: EventPassenger[];
  isCircuitUser: boolean;
  /** Mapa congregationId -> nome (join no front; ver PLANO §4.2.1 Opção B). */
  congregationNameById: Record<string, string>;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pendingAmount(ep: EventPassenger): number {
  return subtractCurrency(ep.totalAmount, ep.paidAmount);
}

function isExempt(ep: EventPassenger): boolean {
  return ep.paymentStatus === PAYMENT_STATUSES.EXEMPT;
}

export function FinancialPassengersTable({
  passengers,
  isCircuitUser,
  congregationNameById,
  page,
  totalPages,
  onPageChange,
}: FinancialPassengersTableProps) {
  if (passengers.length === 0) {
    return (
      <EmptyState
        icon={<Wallet size={48} />}
        title="Nenhum passageiro"
        description="Não há inscrições para o filtro selecionado neste evento."
      />
    );
  }

  function congregationName(ep: EventPassenger): string {
    return congregationNameById[ep.congregationId] ?? "—";
  }

  function pendingCell(ep: EventPassenger) {
    if (isExempt(ep)) return <span className={styles.muted}>—</span>;

    const pending = pendingAmount(ep);
    return <span className={pending > 0 ? styles.pending : styles.muted}>{formatCurrency(pending)}</span>;
  }

  function statusBadge(ep: EventPassenger) {
    return (
      <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[ep.paymentStatus]}>{PAYMENT_STATUS_LABELS[ep.paymentStatus]}</Badge>
    );
  }

  const columns: ColumnDef<EventPassenger>[] = [
    { id: "name", header: "Nome", cell: (ep) => ep.passenger.name },
    { id: "congregation", header: "Congregação", visible: isCircuitUser, cell: congregationName },
    { id: "days", header: "Dias", cell: (ep) => ep.days.length },
    { id: "total", header: "Valor total", cell: (ep) => formatCurrency(ep.totalAmount) },
    { id: "paid", header: "Valor pago", cell: (ep) => formatCurrency(ep.paidAmount) },
    { id: "pending", header: "Pendente", cell: pendingCell },
    { id: "status", header: "Status", cell: statusBadge },
  ];

  return (
    <>
      <ul className={styles.mobileList}>
        {passengers.map((ep) => (
          <li key={ep.id} className={styles.mobileRow}>
            <div className={styles.mobileRowTop}>
              <span className={styles.mobileName}>{ep.passenger.name}</span>
              {statusBadge(ep)}
            </div>

            {isCircuitUser && <span className={styles.mobileCongregation}>{congregationName(ep)}</span>}

            <div className={styles.mobileAmounts}>
              <span className={styles.mobilePaid}>
                {formatCurrency(ep.paidAmount)}{" "}
                <span className={styles.muted}>de {formatCurrency(ep.totalAmount)}</span>
              </span>
              {pendingCell(ep)}
            </div>
          </li>
        ))}
      </ul>

      <DataTable columns={columns} data={passengers} getRowKey={(ep) => ep.id} wrapperClassName={styles.desktopTable} />

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </>
  );
}
