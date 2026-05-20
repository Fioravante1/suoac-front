import styles from "./passengers-page.module.css";

export function PassengersPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Passageiros</h1>
      <p className={styles.description}>Gerencie passageiros e inscrições.</p>
    </div>
  );
}
