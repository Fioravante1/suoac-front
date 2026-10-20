import Link from "next/link";
import { CircleAlert, Clock, Link2Off, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { routes } from "@/shared/config";

import type { TokenState } from "../../model";

import styles from "./token-notice.module.css";

interface TokenNoticeProps {
  state: Exclude<TokenState, "valid">;
}

interface Notice {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Rotulo da saida; o destino e sempre o login, onde se pede link novo. */
  action: string;
}

/**
 * Cada estado tem texto proprio porque cada um pede uma acao diferente de quem
 * le. "Erro ao validar o link" nao diz se a pessoa deve pedir outro, conferir o
 * e-mail ou so tentar de novo.
 */
const NOTICES: Record<Exclude<TokenState, "valid">, Notice> = {
  expired: {
    icon: Clock,
    title: "Este link expirou",
    description:
      "O link de recuperação vale por 1 hora. Peça um novo na tela de entrada e use o mais recente que receber.",
    action: "Pedir um novo link",
  },
  used: {
    icon: CircleAlert,
    title: "Este link já foi usado",
    description:
      "A senha já foi redefinida com ele. Se foi você, entre com a senha nova; se não reconhece essa alteração, peça um novo link e redefina a senha agora.",
    action: "Ir para a entrada",
  },
  invalid: {
    icon: Link2Off,
    title: "Este link não é válido",
    description:
      "Ele pode ter sido cortado pelo programa de e-mail. Abra o link direto da mensagem, ou peça um novo na tela de entrada.",
    action: "Pedir um novo link",
  },
  unavailable: {
    icon: WifiOff,
    title: "Não foi possível verificar o link",
    description:
      "A falha foi nossa, não do seu link: ele continua valendo. Recarregue a página em alguns instantes para tentar de novo.",
    action: "Voltar para a entrada",
  },
};

export function TokenNotice({ state }: TokenNoticeProps) {
  const notice = NOTICES[state];
  const Icon = notice.icon;

  return (
    <section className={styles.notice} aria-labelledby="token-notice-title">
      <span
        className={[styles.icon, state === "unavailable" && styles.iconNeutral].filter(Boolean).join(" ")}
        aria-hidden
      >
        <Icon size={28} strokeWidth={1.9} />
      </span>

      <div className={styles.text}>
        <h2 id="token-notice-title" className={styles.title}>
          {notice.title}
        </h2>
        <p className={styles.description}>{notice.description}</p>
      </div>

      <Link href={routes.login} className={styles.action}>
        {notice.action}
      </Link>
    </section>
  );
}
