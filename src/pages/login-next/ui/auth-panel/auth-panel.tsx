import type { ReactNode } from "react";
import Link from "next/link";

import { routes } from "@/shared/config";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

import styles from "./auth-panel.module.css";

interface AuthPanelProps {
  /**
   * Tela de acesso ativa — entrar, recuperar senha, convite ou autocadastro.
   *
   * Chega vazia por enquanto: as telas sao os cards seguintes da fatia. A moldura
   * ja esta pronta para recebe-las, inclusive a animacao de troca, que roda
   * sozinha porque trocar de tela desmonta uma e monta outra.
   */
  children?: ReactNode;
}

/**
 * Metade direita da tela de entrada: alternancia de tema, a tela de acesso
 * ativa e o rodape institucional.
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
        <Link className={styles.link} href={routes.privacy}>
          Privacidade
        </Link>
        <Link className={styles.link} href={routes.help}>
          Ajuda
        </Link>
      </footer>
    </section>
  );
}
