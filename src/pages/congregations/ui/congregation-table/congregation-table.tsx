import type { Congregation } from "@/entities/congregation";

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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th>E-mail</th>
              <th>Cidade</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {congregations.map((congregation) => (
              <tr key={congregation.id}>
                <td className={styles.name}>{congregation.name}</td>
                <td className={styles.code}>{congregation.code}</td>
                <td className={styles.email}>{normalizeEmail(congregation.email)}</td>
                <td className={styles.city}>{congregation.city ?? "—"}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => onEdit(congregation)}
                      aria-label={`Editar ${congregation.name}`}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                      onClick={() => onDelete(congregation)}
                      aria-label={`Excluir ${congregation.name}`}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                ✏️ Editar
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                onClick={() => onDelete(congregation)}
                aria-label={`Excluir ${congregation.name}`}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
