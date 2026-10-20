"use client";

import { type KeyboardEvent, type Ref, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { TextFieldNext, type TextFieldNextProps } from "@/shared/ui/text-field-next";

import styles from "./password-field-next.module.css";

type PasswordFieldNextProps = Omit<TextFieldNextProps, "type" | "trailing" | "icon" | "hint"> & {
  icon?: TextFieldNextProps["icon"];
  /**
   * Aviso da tela abaixo do campo, para o que o componente nao tem como saber
   * — colagem cortada pelo teto, por exemplo. Cede ao erro de validacao e tem
   * precedencia sobre o Caps Lock: quem avisa de consequencia ja acontecida
   * fala antes de quem avisa de tecla ligada.
   */
  notice?: string;
};

const CAPS_LOCK_WARNING = "Caps Lock está ativado";

/**
 * Campo de senha do redesign: alterna a visibilidade e avisa quando o Caps Lock
 * esta ligado.
 *
 * O aviso existe porque senha errada por Caps Lock e indistinguivel de senha
 * errada de verdade — o usuario tenta de novo, erra de novo, e nao descobre o
 * motivo. O estado e lido do proprio evento de teclado, unico jeito de saber
 * disso no navegador.
 */
export const PasswordFieldNext = forwardRef(function PasswordFieldNext(
  { onKeyDown, onKeyUp, error, notice, ...props }: PasswordFieldNextProps,
  ref: Ref<HTMLInputElement>,
) {
  const [visible, setVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const toggleLabel = visible ? "Ocultar senha" : "Mostrar senha";

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  /*
   * Um texto por vez embaixo do campo: dois competiriam. O erro e o que precisa
   * ser resolvido, por isso vem primeiro; o aviso da tela vem antes do Caps
   * Lock porque fala de algo que ja aconteceu com o que foi digitado.
   */
  function resolveHint() {
    if (error) return undefined;
    if (notice) return notice;
    if (capsLockOn) return CAPS_LOCK_WARNING;
    return undefined;
  }

  return (
    <TextFieldNext
      {...props}
      ref={ref}
      error={error}
      type={visible ? "text" : "password"}
      hint={resolveHint()}
      onKeyDown={(event) => {
        trackCapsLock(event);
        onKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        trackCapsLock(event);
        onKeyUp?.(event);
      }}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((current) => !current)}
          aria-label={toggleLabel}
          aria-pressed={visible}
          title={toggleLabel}
          disabled={props.disabled}
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={1.8} aria-hidden />
          ) : (
            <Eye size={18} strokeWidth={1.8} aria-hidden />
          )}
        </button>
      }
    />
  );
});
