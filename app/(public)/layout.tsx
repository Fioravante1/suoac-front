import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { routes } from "@/shared/config";

import styles from "./layout.module.css";

/**
 * Moldura das paginas publicas de conteudo — Privacidade e Ajuda.
 *
 * Sao alcancadas pelo rodape da tela de entrada e nao exigem sessao, por isso
 * nao ficam sob `(private)`. Tambem nao ficam sob `(auth)`: aquele grupo e das
 * telas de acesso, que tem layout proprio de duas colunas.
 *
 * Nasceram no redesign, entao acompanham os dois temas e nao recebem contencao.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        {/*
         * Só o nome, sem o simbolo: as duas variantes disponiveis sao cada uma
         * para um fundo (`logo.png` para claro, `logo-mark-dark.png` para
         * escuro), e esta pagina acompanha o tema. Trocar a imagem por tema
         * custaria CSS e um segundo request por um elemento decorativo — o nome
         * ja identifica a marca. Vale reconsiderar quando houver uma variante
         * que sirva aos dois temas.
         */}
        <Link className={styles.brand} href={routes.login}>
          <span className={styles.wordmark}>SUOAC</span>
        </Link>

        <Link className={styles.back} href={routes.login}>
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          Voltar para entrar
        </Link>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>© {currentYear} SUOAC</footer>
    </div>
  );
}
