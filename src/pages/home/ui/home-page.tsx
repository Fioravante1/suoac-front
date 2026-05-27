"use client";

import { useAuthPermissions } from "@/shared/auth";
import { signOutAction } from "@/features/sign-in";

import styles from "./home-page.module.css";

export function HomePage() {
  const { user } = useAuthPermissions();

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
