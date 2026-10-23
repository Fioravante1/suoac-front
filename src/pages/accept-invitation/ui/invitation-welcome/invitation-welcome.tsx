import Link from "next/link";
import { Check } from "lucide-react";

import { INVITATION_ROLE_SHORT_LABELS, isInvitationRole } from "@/entities/invitation";
import { routes } from "@/shared/config";
/*
 * Do modulo, nao do barril `@/shared/lib`: este componente e renderizado no
 * servidor, e o barril reexporta hooks `"use client"` — o build falha ao ver
 * hook de cliente alcancado por Server Component.
 */
import { getFirstName } from "@/shared/lib/string";

import type { WelcomeSummary } from "../../model";

import styles from "./invitation-welcome.module.css";

interface InvitationWelcomeProps {
  summary: WelcomeSummary;
}

/**
 * Confirmacao do aceite: o acesso esta liberado e o convidado segue para o
 * painel.
 *
 * Nao promete que o coordenador do circuito foi avisado, como o desenho diz: o
 * back ainda nao notifica o aceite. Dizer isso seria afirmar um efeito que nao
 * acontece.
 */
export function InvitationWelcome({ summary }: InvitationWelcomeProps) {
  const role = isInvitationRole(summary.role) ? INVITATION_ROLE_SHORT_LABELS[summary.role] : summary.role;

  return (
    <section className={styles.confirmation} aria-labelledby="invitation-welcome-title">
      <span className={styles.icon} aria-hidden>
        <Check size={30} strokeWidth={2.2} />
      </span>

      <div className={styles.text}>
        <h2 id="invitation-welcome-title" className={styles.title}>
          Bem-vindo, {getFirstName(summary.name)}!
        </h2>
        <p className={styles.subtitle}>Seu acesso está liberado.</p>
      </div>

      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryKey}>Privilégio</dt>
          <dd className={styles.summaryValue}>{role}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryKey}>Congregação</dt>
          <dd className={styles.summaryValue}>
            {summary.congregation} · {summary.congregationCode}
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryKey}>Login</dt>
          <dd className={styles.summaryValue}>{summary.email}</dd>
        </div>
      </dl>

      <Link href={routes.dashboard} className={styles.action}>
        Entrar no painel
      </Link>
    </section>
  );
}
