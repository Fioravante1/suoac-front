"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CircleAlert, Clock, Link2Off, UserCheck, UserX, WifiOff, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatDate } from "@/shared/lib";
import { routes } from "@/shared/config";
import { Spinner } from "@/shared/ui/spinner";

import { requestRenewalAction } from "../../api";

import type { InvitationNoticeState, InvitationRejection } from "../../model";
import { InvitationRenewalSent } from "../invitation-renewal-sent";

import styles from "./invitation-notice.module.css";

interface InvitationNoticeProps {
  rejection: InvitationRejection;
  /** Token do link, para o pedido de novo convite no expirado. */
  token: string;
}

interface Notice {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Rotulo da saida; o destino e sempre a tela de entrada. */
  action: string;
  tone: "attention" | "critical" | "neutral";
}

/**
 * Cada estado tem texto proprio porque cada um pede uma acao diferente de quem
 * le: expirado e cancelado pedem convite novo, usado e e-mail ja cadastrado
 * levam a entrada, e so a falha do servico permite tentar de novo.
 */
const NOTICES: Record<InvitationNoticeState, Notice> = {
  expired: {
    icon: Clock,
    title: "Este convite expirou",
    description:
      "Por segurança, os convites valem 7 dias. Peça um novo link ao coordenador do arranjo de ônibus no circuito.",
    action: "Ir para a entrada",
    tone: "critical",
  },
  used: {
    icon: UserCheck,
    title: "Este convite já foi usado",
    description:
      "A conta já foi criada com ele. Se foi você, entre com o seu e-mail e a sua senha; se não reconhece este cadastro, avise quem convidou você.",
    action: "Ir para a entrada",
    tone: "attention",
  },
  revoked: {
    icon: XCircle,
    title: "Este convite foi cancelado",
    description: "Quem convidou você cancelou este convite. Peça um novo a ele, se ainda precisar de acesso.",
    action: "Ir para a entrada",
    tone: "critical",
  },
  declined: {
    icon: UserX,
    title: "Este convite foi recusado",
    description: "Ele não pode mais ser aceito. Se a recusa foi engano, peça um novo convite a quem convidou você.",
    action: "Ir para a entrada",
    tone: "neutral",
  },
  "not-found": {
    icon: Link2Off,
    title: "Este convite não é válido",
    description:
      "O link pode ter sido cortado pelo programa de e-mail ou de mensagens. Abra o link direto da mensagem, ou peça um novo convite a quem convidou você.",
    action: "Ir para a entrada",
    tone: "attention",
  },
  "email-registered": {
    icon: CircleAlert,
    title: "Este e-mail já tem uma conta",
    description:
      "Já existe uma conta com o e-mail deste convite. Entre com a sua senha. Para participar de outra congregação, fale com quem convidou você.",
    action: "Ir para a entrada",
    tone: "attention",
  },
  unavailable: {
    icon: WifiOff,
    title: "Não foi possível abrir o convite",
    description:
      "A falha foi nossa, não do seu link: ele continua valendo. Recarregue a página em alguns instantes para tentar de novo.",
    action: "Voltar para a entrada",
    tone: "neutral",
  },
};

type RenewalRequest = "idle" | "sending" | "sent";

const REQUEST_FAILED = "Não foi possível enviar o pedido agora. Verifique sua conexão e tente novamente.";

const TONE_CLASS: Record<Notice["tone"], string> = {
  attention: styles.iconAttention,
  critical: styles.iconCritical,
  neutral: styles.iconNeutral,
};

/**
 * Aviso de convite que nao pode ser aceito. No expirado, "Pedir novo convite"
 * avisa quem convidou e leva a "Pedido enviado" (SUC-76); se o convite mudou de
 * estado nesse meio-tempo, o aviso troca pelo estado verdadeiro.
 */
export function InvitationNotice({ rejection, token }: InvitationNoticeProps) {
  const [current, setCurrent] = useState(rejection);
  const [request, setRequest] = useState<RenewalRequest>("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  /*
   * O aviso sai do DOM quando o pedido e enviado, levando junto o foco, que
   * cai no `body`. Mover o foco para a confirmacao anuncia o conteudo e
   * devolve o ponto de leitura a quem usa leitor de tela.
   */
  const focusResult = useCallback((node: HTMLElement | null) => {
    node?.focus();
  }, []);

  const { state, details } = current;
  const notice = NOTICES[state];
  const Icon = notice.icon;
  const canRequestNew = state === "expired";
  const isSending = request === "sending";

  async function requestNew() {
    setRequestError(null);
    setRequest("sending");

    try {
      const result = await requestRenewalAction({ token });

      if (result.status === "requested") {
        setRequest("sent");
        return;
      }

      setRequest("idle");

      if (result.status === "rejected") {
        setCurrent(result.rejection);
        return;
      }

      setRequestError(result.message);
    } catch {
      // Falha antes de a action responder — conexao caida, deploy no meio da requisicao.
      setRequest("idle");
      setRequestError(REQUEST_FAILED);
    }
  }

  if (request === "sent") {
    return (
      <div ref={focusResult} tabIndex={-1}>
        <InvitationRenewalSent invitedBy={details?.invitedBy ?? null} email={details?.email ?? null} />
      </div>
    );
  }

  return (
    <section className={styles.notice} aria-labelledby="invitation-notice-title">
      <span className={[styles.icon, TONE_CLASS[notice.tone]].join(" ")} aria-hidden>
        <Icon size={28} strokeWidth={1.9} />
      </span>

      <div className={styles.text}>
        <h2 id="invitation-notice-title" className={styles.title}>
          {notice.title}
        </h2>
        <p className={styles.description}>{notice.description}</p>
      </div>

      {state === "expired" && details && (
        <dl className={styles.summary}>
          <div className={styles.summaryRow}>
            <dt className={styles.summaryKey}>Enviado para</dt>
            <dd className={styles.summaryValue}>{details.email}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt className={styles.summaryKey}>Enviado por</dt>
            <dd className={styles.summaryValue}>{details.invitedBy}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt className={styles.summaryKey}>Enviado em</dt>
            <dd className={styles.summaryValue}>{formatDate(details.sentAt)}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt className={styles.summaryKey}>Expirou em</dt>
            <dd className={styles.summaryValue}>{formatDate(details.expiresAt)}</dd>
          </div>
        </dl>
      )}

      {canRequestNew && (
        <button type="button" className={styles.action} onClick={() => void requestNew()} disabled={isSending}>
          {isSending && <Spinner className={styles.spinner} size="small" />}
          {isSending ? "Enviando…" : "Pedir novo convite"}
        </button>
      )}

      {requestError && (
        <p key={requestError} className={styles.requestError} role="alert">
          {requestError}
        </p>
      )}

      <Link href={routes.login} className={canRequestNew ? styles.secondaryAction : styles.action}>
        {notice.action}
      </Link>
    </section>
  );
}
