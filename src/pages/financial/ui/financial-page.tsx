import styles from "./financial-page.module.css";

export function FinancialPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Financeiro</h1>
      <p className={styles.description}>Acompanhe pagamentos e resumos financeiros.</p>
    </div>
  );
}
