"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import styles from "./logout-button.module.css";

type LogoutButtonVariant = "icon" | "stacked";

type LogoutButtonProps = Readonly<{
  variant: LogoutButtonVariant;
}>;

const ICON_SIZE: Record<LogoutButtonVariant, number> = {
  icon: 18,
  stacked: 22,
};

/**
 * Botão de logout. Lê o estado do `<form action={signOutAction}>` pai via `useFormStatus`
 * apenas para se desabilitar durante o submit (evita duplo clique). O feedback visual de
 * carregamento é dado pelo `LogoutOverlay`, em tela cheia.
 *
 * - `icon`: apenas ícone (sidebar desktop).
 * - `stacked`: ícone + label empilhados (bottom nav mobile).
 */
export function LogoutButton({ variant }: LogoutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`${styles.button} ${styles[variant]}`}
      aria-label="Sair"
      aria-busy={pending}
      disabled={pending}
    >
      <LogOut size={ICON_SIZE[variant]} />
      {variant === "stacked" && <span className={styles.label}>Sair</span>}
    </button>
  );
}
