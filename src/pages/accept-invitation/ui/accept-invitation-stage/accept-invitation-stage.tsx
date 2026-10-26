"use client";

import { useCallback, useState } from "react";

import type { Invitation } from "@/entities/invitation";
import { formatDate } from "@/shared/lib";
import { AuthShell } from "@/widgets/auth-shell";

import { AcceptInvitationFlow } from "../accept-invitation-flow";
import { InvitationDeclined } from "../invitation-declined";
import { InvitationTicket } from "../invitation-ticket";

interface AcceptInvitationStageProps {
  /** Token do link, ja em minusculas. */
  token: string;
  invitation: Invitation;
}

/**
 * Moldura do convite pendente: o cartao a esquerda e o fluxo a direita.
 *
 * Existe para que a recusa mude os dois lados juntos. A recusa nao abre sessao,
 * entao o Next nao re-renderiza a rota depois da action (diferente do aceite,
 * que termina em `redirect`): o cartao, renderizado no servidor, so troca o
 * selo para "Recusado" se quem o renderiza souber da recusa.
 */
export function AcceptInvitationStage({ token, invitation }: AcceptInvitationStageProps) {
  const [isDeclined, setIsDeclined] = useState(false);
  /*
   * O formulario sai do DOM quando a recusa e gravada, levando junto o foco,
   * que cai no `body`. Mover o foco para a confirmacao anuncia o conteudo e
   * devolve o ponto de leitura a quem usa leitor de tela.
   */
  const focusResult = useCallback((node: HTMLElement | null) => {
    node?.focus();
  }, []);

  return (
    <AuthShell
      aside={
        <InvitationTicket
          invitation={invitation}
          badge={isDeclined ? "declined" : "pending"}
          footnote={isDeclined ? "Convite recusado hoje" : `Convite válido até ${formatDate(invitation.expiresAt)}`}
        />
      }
    >
      {isDeclined ? (
        <div ref={focusResult} tabIndex={-1}>
          <InvitationDeclined invitedBy={invitation.invitedBy} />
        </div>
      ) : (
        <AcceptInvitationFlow token={token} invitation={invitation} onDeclined={() => setIsDeclined(true)} />
      )}
    </AuthShell>
  );
}
