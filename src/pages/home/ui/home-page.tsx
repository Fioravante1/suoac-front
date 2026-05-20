"use client";

import { useAuth } from "@/shared/auth";
import { signOutAction } from "@/features/sign-in/api/sign-out-action";

import styles from "./home-page.module.css";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Bem-vindo, {user?.name ?? "Usuário"}!</h1>
        <form action={signOutAction}>
          <button type="submit" className={styles.logoutButton}>
            Sair
          </button>
        </form>
      </main>
    </div>
  );
}
