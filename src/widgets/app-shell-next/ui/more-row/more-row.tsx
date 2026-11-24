import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

import styles from "./more-row.module.css";

export type MoreRowTone = "primary" | "info" | "attention" | "neutral" | "critical";

type MoreRowBaseProps = Readonly<{
  icon: LucideIcon;
  tone: MoreRowTone;
  label: string;
  /** Linha de apoio sob o rótulo. */
  hint?: string;
}>;

type MoreRowLinkProps = MoreRowBaseProps & Readonly<{ href: string }>;

type MoreRowButtonProps = MoreRowBaseProps &
  Readonly<{
    onClick: () => void;
    /** O que aparece à direita: o interruptor, o "Em breve"; sem nada, é só a ação. */
    trailing?: ReactNode;
    /** Interruptor: o estado fica em `aria-checked`. */
    checked?: boolean;
    /** Sem destino ainda: fica no Tab, para a dica "Em breve" ser descoberta por teclado. */
    isDisabled?: boolean;
    isBusy?: boolean;
  }>;

type MoreRowProps = MoreRowLinkProps | MoreRowButtonProps;

function isLink(props: MoreRowProps): props is MoreRowLinkProps {
  return "href" in props;
}

/**
 * Uma linha da tela Mais (`SUOAC Dashboard Mobile.dc.html`): ícone de 34px em fundo da cor do tom,
 * rótulo com a linha de apoio e, à direita, a seta de um atalho ou o que a ação precisar.
 * Atalho é link; o resto, botão, com 56px de altura para o toque.
 */
export function MoreRow(props: MoreRowProps) {
  const { icon: Icon, tone, label, hint } = props;

  const content = (
    <>
      <span className={styles.icon} data-tone={tone} aria-hidden="true">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </>
  );

  if (isLink(props)) {
    return (
      <Link href={props.href} className={styles.row} data-tone={tone}>
        {content}
        <ChevronRight className={styles.chevron} size={16} strokeWidth={2} aria-hidden="true" />
      </Link>
    );
  }

  const isSwitch = props.checked !== undefined;

  return (
    <button
      type="button"
      className={styles.row}
      data-tone={tone}
      role={isSwitch ? "switch" : undefined}
      aria-checked={isSwitch ? props.checked : undefined}
      aria-disabled={props.isDisabled || undefined}
      aria-busy={props.isBusy || undefined}
      onClick={props.isDisabled ? undefined : props.onClick}
    >
      {content}
      {props.trailing}
    </button>
  );
}
