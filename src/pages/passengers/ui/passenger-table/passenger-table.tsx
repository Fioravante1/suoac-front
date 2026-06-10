import { Pencil, Trash2 } from "lucide-react";

import type { Passenger } from "@/entities/passenger";
import { formatPassengerObservations, formatPassengerPhone } from "@/entities/passenger";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "@/shared/ui/table";

import styles from "./passenger-table.module.css";

interface PassengerTableProps {
  passengers: Passenger[];
  onEdit: (passenger: Passenger) => void;
  onDelete: (passenger: Passenger) => void;
  showCongregation?: boolean;
}

export function PassengerTable({ passengers, onEdit, onDelete, showCongregation = false }: PassengerTableProps) {
  return (
    <>
      <div className={styles.desktopOnly}>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>RG</TableHead>
                {showCongregation && <TableHead>Congregação</TableHead>}
                <TableHead>Telefone</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className={styles.actionsHead}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell className={styles.name}>{passenger.name}</TableCell>
                  <TableCell className={styles.rg}>{passenger.rg}</TableCell>
                  {showCongregation && (
                    <TableCell className={styles.congregation}>{passenger.congregationName ?? "—"}</TableCell>
                  )}
                  <TableCell className={styles.muted}>{formatPassengerPhone(passenger.phone)}</TableCell>
                  <TableCell className={styles.observations}>
                    {formatPassengerObservations(passenger.observations)}
                  </TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => onEdit(passenger)}
                        aria-label={`Editar ${passenger.name}`}
                      >
                        <Pencil size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        onClick={() => onDelete(passenger)}
                        aria-label={`Excluir ${passenger.name}`}
                      >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      <div className={styles.mobileCards}>
        {passengers.map((passenger) => (
          <article key={passenger.id} className={styles.mobileCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardName}>{passenger.name}</span>
              <span className={styles.mobileCardRg}>{passenger.rg}</span>
            </div>
            {showCongregation && passenger.congregationName && (
              <span className={styles.mobileCardCongregation}>{passenger.congregationName}</span>
            )}
            <span className={styles.mobileCardDetail}>{formatPassengerPhone(passenger.phone)}</span>
            <span className={styles.mobileCardDetail}>{formatPassengerObservations(passenger.observations)}</span>
            <div className={styles.mobileCardActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onEdit(passenger)}
                aria-label={`Editar ${passenger.name}`}
              >
                <Pencil size={16} />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                onClick={() => onDelete(passenger)}
                aria-label={`Excluir ${passenger.name}`}
              >
                <Trash2 size={16} />
                <span>Excluir</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
