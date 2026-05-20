import styles from "./settings-page.module.css";

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Configurações</h1>
      <p className={styles.description}>Configurações do sistema.</p>
    </div>
  );
}
