import { Spinner } from "@/shared/ui/spinner";

import type { SignupSummary } from "../../model";

import styles from "./signup-step-success.module.css";

interface SignupStepSuccessProps {
  /** Resumo dos dados cadastrados e consolidados na confirmação por código. */
  summary: SignupSummary;
  /** Navegação para o painel em andamento. */
  isEnteringDashboard?: boolean;
  /** Entra no painel já autenticado. */
  onEnterDashboard: () => void;
}

/**
 * Etapa final do autocadastro de circuito (SUC-33).
 *
 * Exibe o resumo do que acabou de ser consolidado no servidor e leva o
 * coordenador direto para o painel — a sessão já foi aberta na confirmação do
 * código de 6 dígitos (SUC-32).
 */
export function SignupStepSuccess({ summary, isEnteringDashboard = false, onEnterDashboard }: SignupStepSuccessProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 id="signup-title" className={styles.title}>
          Circuito {summary.circuitName} criado
        </h2>
        <p className={styles.subtitle}>
          Tudo pronto. Agora você pode criar o primeiro evento e convidar as congregações.
        </p>
      </header>

      <dl className={styles.summary} aria-label="Resumo do cadastro">
        {summary.rows.map((row) => (
          <div key={row.label} className={styles.summaryRow}>
            <dt className={styles.summaryKey}>{row.label}</dt>
            <dd className={styles.summaryValue}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <button type="button" className={styles.submit} onClick={onEnterDashboard} disabled={isEnteringDashboard}>
        {isEnteringDashboard && <Spinner className={styles.spinner} size="small" />}
        Ir para o painel
      </button>
    </div>
  );
}
