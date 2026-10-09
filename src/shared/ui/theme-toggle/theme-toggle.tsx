"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/shared/theme";

import styles from "./theme-toggle.module.css";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Alterna entre tema claro e escuro.
 *
 * Os dois icones sao renderizados sempre, e o CSS decide qual aparece a partir do
 * atributo `data-theme` no `<html>`. Escolher o icone em JavaScript exigiria saber
 * a preferencia do sistema operacional durante a renderizacao — informacao que o
 * servidor nao tem —, o que produziria divergencia de hidratacao. Como efeito
 * colateral, o icone correto aparece mesmo antes de o JavaScript carregar.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={[styles.toggle, className].filter(Boolean).join(" ")}
      title="Alternar tema"
      aria-label="Alternar tema"
    >
      <Sun className={styles.sun} size={18} strokeWidth={1.8} aria-hidden />
      <Moon className={styles.moon} size={18} strokeWidth={1.8} aria-hidden />
    </button>
  );
}
