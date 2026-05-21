import { Pencil, Trash2 } from "lucide-react";
import type { Congregation } from "@/entities/congregation";

import { TableWrapper, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/shared/ui/table";

import styles from "./congregation-table.module.css";

interface CongregationTableProps {
  congregations: Congregation[];
  onEdit: (congregation: Congregation) => void;
  onDelete: (congregation: Congregation) => void;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

export function CongregationTable({ congregations, onEdit, onDelete }: CongregationTableProps) {
  return (
    <>
      {/* Desktop: table */}
      <div className={styles.desktopOnly}>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead style={{ textAlign: "right" }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {congregations.map((congregation) => (
                <TableRow key={congregation.id}>
                  <TableCell className={styles.name}>{congregation.name}</TableCell>
                  <TableCell className={styles.code}>{congregation.code}</TableCell>
                  <TableCell className={styles.email}>{normalizeEmail(congregation.email)}</TableCell>
                  <TableCell className={styles.city}>{congregation.city ?? "—"}</TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => onEdit(congregation)}
                        aria-label={`Editar ${congregation.name}`}
                      >
                        <Pencil size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        onClick={() => onDelete(congregation)}
                        aria-label={`Excluir ${congregation.name}`}
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

      {/* Mobile: cards */}
      <div className={styles.mobileCards}>
        {congregations.map((congregation) => (
          <div key={congregation.id} className={styles.mobileCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardName}>{congregation.name}</span>
            </div>
            <span className={styles.mobileCardDetail}>Código: {congregation.code}</span>
            <span className={styles.mobileCardDetail}>{normalizeEmail(congregation.email)}</span>
            {congregation.city && <span className={styles.mobileCardDetail}>Cidade: {congregation.city}</span>}
            <div className={styles.mobileCardActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onEdit(congregation)}
                aria-label={`Editar ${congregation.name}`}
              >
                <Pencil size={16} />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                onClick={() => onDelete(congregation)}
                aria-label={`Excluir ${congregation.name}`}
              >
                <Trash2 size={16} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
