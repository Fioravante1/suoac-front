import styles from "./events-page.module.css";

export function EventsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Eventos</h1>
      <p className={styles.description}>Gerencie assembleias e congressos.</p>
    </div>
  );
}
