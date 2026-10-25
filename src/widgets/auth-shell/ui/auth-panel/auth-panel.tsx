import type { ReactNode } from "react";
import Link from "next/link";

import { routes } from "@/shared/config";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

import styles from "./auth-panel.module.css";

interface AuthPanelProps {
  /**
   * Tela de acesso ativa — entrar, recuperar senha, convite ou autocadastro.
   *
   * A animacao de troca roda sozinha, porque trocar de tela desmonta uma e
   * monta outra.
   */
  children?: ReactNode;
}

/**
 * Metade direita das telas de acesso: alternancia de tema, a tela ativa e o
 * rodape institucional.
 *
 * Diferente do painel de apresentacao, esta coluna acompanha o tema escolhido.
 */
export function AuthPanel({ children }: AuthPanelProps) {
  // Calculado no servidor a cada requisicao: a rota e dinamica por ler o cookie
  // de tema, entao o ano nao congela numa build antiga.
  const currentYear = new Date().getFullYear();

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <ThemeToggle />
      </header>

      <div className={styles.viewport}>
        <div className={styles.view}>{children}</div>
      </div>

      <footer className={styles.footer}>
        <span>© {currentYear} SUOAC</span>
        <Link className={styles.link} href={routes.privacy} target="_blank" rel="noopener noreferrer">
          Privacidade
        </Link>
        <Link className={styles.link} href={routes.help} target="_blank" rel="noopener noreferrer">
          Ajuda
        </Link>
      </footer>
    </section>
  );
}
