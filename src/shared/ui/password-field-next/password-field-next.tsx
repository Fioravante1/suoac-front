"use client";

import { type KeyboardEvent, type Ref, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { TextFieldNext, type TextFieldNextProps } from "@/shared/ui/text-field-next";

import styles from "./password-field-next.module.css";

type PasswordFieldNextProps = Omit<TextFieldNextProps, "type" | "trailing" | "icon" | "hint"> & {
  icon?: TextFieldNextProps["icon"];
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
  { onKeyDown, onKeyUp, error, ...props }: PasswordFieldNextProps,
  ref: Ref<HTMLInputElement>,
) {
  const [visible, setVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const toggleLabel = visible ? "Ocultar senha" : "Mostrar senha";

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <TextFieldNext
      {...props}
      ref={ref}
      error={error}
      type={visible ? "text" : "password"}
      // O aviso cede lugar ao erro: dois textos embaixo do campo competiriam, e
      // o erro e o que o usuario precisa resolver primeiro.
      hint={capsLockOn && !error ? CAPS_LOCK_WARNING : undefined}
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
