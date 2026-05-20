"use client";

import { useAuth } from "@/shared/auth";

import styles from "./dashboard-page.module.css";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>
      <p className={styles.greeting}>Bem-vindo, {user?.name ?? "Usuário"}!</p>
    </div>
  );
}
