import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from "react";

import styles from "./text-field-next.module.css";

export interface TextFieldNextProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Icone a esquerda, dentro do campo. */
  icon?: ReactNode;
  /** Acao alinhada a direita do rotulo — "Esqueci a senha", por exemplo. */
  labelAction?: ReactNode;
  /** Controle a direita, dentro do campo. Usado pelo campo de senha. */
  trailing?: ReactNode;
  error?: string;
  /** Aviso discreto abaixo do campo, que nao e erro de validacao. */
  hint?: ReactNode;
  /**
   * Veredito da borda sem mensagem abaixo do campo.
   *
   * Para o campo que so tem como estar certo ou errado em relacao a outro, como
   * a confirmacao de senha: ali o retorno vale enquanto se digita, e o texto que
   * o explica fica ao lado do rotulo, nao embaixo. `error` tem precedencia e
   * continua sendo o caminho de erro de validacao com mensagem.
   */
  status?: "valid" | "invalid";
}

/**
 * Campo de texto do redesign: borda no contorno do campo, com icone e controles
 * dentro dele.
 *
 * Nasce ao lado de `text-field` em vez de virar uma variante dele porque a
 * estrutura do DOM e outra — hoje a borda e do proprio `input` e o icone fica
 * sobreposto. Mudar isso repintaria todas as telas que ainda nao foram
 * redesenhadas. Os dois convivem ate o corte do legado; ver
 * `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` §3.2.
 */
export const TextFieldNext = forwardRef<HTMLInputElement, TextFieldNextProps>(function TextFieldNext(
  { label, icon, labelAction, trailing, error, hint, status, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const statusId = `${inputId}-status`;
  const message = error ?? hint;
  /*
   * Sem mensagem abaixo do campo, quem explica o veredito e o texto ao lado do
   * rotulo. Liga-lo e o que evita o campo anunciar "invalido" e mais nada para
   * quem volta nele depois de a regiao viva ja ter falado.
   */
  const describedBy = message ? messageId : status && labelAction ? statusId : undefined;

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {labelAction && (
          <span id={statusId} className={styles.labelActionSlot}>
            {labelAction}
          </span>
        )}
      </div>

      <div
        className={[
          styles.control,
          (error || status === "invalid") && styles.invalid,
          !error && status === "valid" && styles.valid,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {icon && (
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={styles.input}
          aria-invalid={error || status === "invalid" ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {trailing}
      </div>

      {message && (
        <span
          id={messageId}
          className={error ? styles.error : styles.hint}
          // Erro de validacao interrompe; aviso de contexto (Caps Lock) apenas
          // informa quando o leitor de tela chegar nele.
          role={error ? "alert" : undefined}
        >
          {message}
        </span>
      )}
    </div>
  );
});
