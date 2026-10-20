import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { routes } from "@/shared/config";

import styles from "./reset-password-success.module.css";

/**
 * Confirmacao da senha trocada.
 *
 * E renderizada pela propria rota, a partir de `?status=sucesso`, e nao por
 * estado de React no formulario. A diferenca nao e estilistica: a action apaga
 * o cookie de sessao, o que faz o Next re-renderizar a rota junto da resposta;
 * guardada em estado, esta tela seria substituida pela reavaliacao do token ja
 * consumido. Em rota propria ela sobrevive — e o token sai da URL.
 */
export function ResetPasswordSuccess() {
  return (
    <section className={styles.confirmation} aria-labelledby="reset-password-success-title">
      <span className={styles.icon} aria-hidden>
        <ShieldCheck size={30} strokeWidth={2} />
      </span>

      <div className={styles.text}>
        <h2 id="reset-password-success-title" className={styles.title}>
          Senha alterada
        </h2>
        <p className={styles.subtitle}>
          Sua senha foi atualizada e as outras sessões foram encerradas. Use a senha nova no próximo acesso.
        </p>
      </div>

      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryKey}>Outros dispositivos</dt>
          <dd className={styles.summaryValue}>Desconectados</dd>
        </div>
      </dl>

      <Link href={routes.login} className={styles.action}>
        Ir para a entrada
      </Link>
    </section>
  );
}
