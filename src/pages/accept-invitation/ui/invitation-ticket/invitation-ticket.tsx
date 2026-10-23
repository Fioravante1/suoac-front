import Image from "next/image";

import { INVITATION_ROLE_LABELS, isInvitationRole, type Invitation } from "@/entities/invitation";
/*
 * Do modulo, nao do barril `@/shared/lib`: este componente e renderizado no
 * servidor, e o barril reexporta hooks `"use client"` — o build falha ao ver
 * hook de cliente alcancado por Server Component.
 */
import { getFirstName, getInitials } from "@/shared/lib/string";
import { BrandPanelFrame } from "@/widgets/auth-shell";

import styles from "./invitation-ticket.module.css";

/** O que o cartao precisa do convite — o resumo de boas-vindas tem o mesmo recorte. */
export type TicketInvitation = Pick<
  Invitation,
  "role" | "invitedBy" | "circuit" | "circuitCity" | "circuitState" | "congregation" | "congregationCode"
>;

export type TicketBadge = "pending" | "accepted" | "declined";

interface InvitationTicketProps {
  invitation: TicketInvitation;
  badge: TicketBadge;
  /** Linha abaixo do cartao: validade do convite ou confirmacao do aceite ou da recusa. */
  footnote: string;
}

const BADGES: Record<TicketBadge, { label: string; className: string }> = {
  pending: { label: "Aguardando você", className: styles.badgePending },
  accepted: { label: "Aceito", className: styles.badgeAccepted },
  declined: { label: "Recusado", className: styles.badgeDeclined },
};

/**
 * Painel esquerdo da tela de convite: quem convidou, para qual privilegio, em
 * qual congregacao e circuito.
 *
 * E o que o convidado precisa reconhecer para confiar no link antes de digitar
 * qualquer dado (SUC-27). Substitui a apresentacao da marca, na mesma moldura
 * navy — nos dois temas, por decisao de marca.
 */
export function InvitationTicket({ invitation, badge, footnote }: InvitationTicketProps) {
  const role = isInvitationRole(invitation.role) ? INVITATION_ROLE_LABELS[invitation.role] : invitation.role;
  const { label, className } = BADGES[badge];

  return (
    <BrandPanelFrame>
      <div className={styles.brand}>
        {/* O nome ao lado ja identifica a marca; a imagem e decorativa. */}
        <Image src="/logo-mark-dark.png" alt="" width={42} height={42} className={styles.logo} priority />
        <span className={styles.wordmark}>SUOAC</span>
      </div>

      <div className={styles.copy}>
        <span className={styles.eyebrow}>Convite</span>
        <h1 className={styles.headline}>
          {getFirstName(invitation.invitedBy)} convidou você para o arranjo de ônibus.
        </h1>
      </div>

      <div className={styles.ticket}>
        <div className={styles.privilege}>
          <div className={styles.privilegeRow}>
            <span className={styles.fieldLabel}>Privilégio</span>
            <span className={[styles.badge, className].join(" ")}>
              <span className={styles.badgeDot} aria-hidden />
              {label}
            </span>
          </div>
          <span className={styles.role}>{role}</span>
        </div>

        <dl className={styles.places}>
          <div className={styles.place}>
            <dt className={styles.fieldLabel}>Congregação</dt>
            <dd className={styles.placeName}>{invitation.congregation}</dd>
            <dd className={styles.placeDetail}>Código {invitation.congregationCode}</dd>
          </div>
          <div className={styles.place}>
            <dt className={styles.fieldLabel}>Circuito</dt>
            <dd className={styles.placeName}>{invitation.circuit}</dd>
            <dd className={styles.placeDetail}>
              {invitation.circuitCity} · {invitation.circuitState}
            </dd>
          </div>
        </dl>

        <div className={styles.person}>
          <span className={styles.avatar} aria-hidden>
            {getInitials(invitation.invitedBy)}
          </span>
          <span className={styles.personText}>
            <span className={styles.personName}>Enviado por {invitation.invitedBy}</span>
            <span className={styles.personRole}>Coordenador do arranjo de ônibus no circuito</span>
          </span>
        </div>
      </div>

      <p className={styles.footnote}>{footnote}</p>
    </BrandPanelFrame>
  );
}
