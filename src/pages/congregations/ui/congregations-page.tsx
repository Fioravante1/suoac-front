import styles from "./congregations-page.module.css";

export function CongregationsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Congregações</h1>
      <p className={styles.description}>Gerencie as congregações do circuito.</p>
    </div>
  );
}
