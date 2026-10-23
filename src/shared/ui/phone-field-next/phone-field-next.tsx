"use client";

import { type ChangeEvent, type KeyboardEvent, forwardRef } from "react";

import { PHONE_MASK_MAX_LENGTH, formatPhoneInput, isPhoneDeletionKey, phoneDeletionRange } from "@/shared/lib";
import { TextFieldNext, type TextFieldNextProps } from "@/shared/ui/text-field-next";

type PhoneFieldNextProps = Omit<TextFieldNextProps, "type" | "inputMode" | "maxLength">;

/**
 * Campo de celular do redesign: aplica a mascara `(00) 00000-0000` enquanto se
 * digita, mantendo o cursor junto ao digito editado.
 *
 * O valor que chega ao formulario e o texto mascarado; quem o envia a API
 * extrai os digitos (`phoneDigits`), porque a API guarda so eles. Funciona
 * igual com `register` do React Hook Form (o `onChange` repassado e chamado
 * depois da mascara) e como campo controlado.
 */
export const PhoneFieldNext = forwardRef<HTMLInputElement, PhoneFieldNextProps>(function PhoneFieldNext(
  { onChange, onKeyDown, autoComplete = "tel", placeholder = "(19) 99999-9999", ...props },
  ref,
) {
  /*
   * Antes da exclusao nativa, estende a selecao sobre o separador vizinho: sem
   * isto, `Backspace` sobre o hifen so move o cursor e a mascara o recoloca.
   */
  function extendDeletionOverSeparators(event: KeyboardEvent<HTMLInputElement>) {
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    const hasModifier = event.altKey || event.ctrlKey || event.metaKey;

    if (!isPhoneDeletionKey(event.key) || hasModifier) return;
    if (selectionStart === null || selectionStart !== selectionEnd) return;

    const [start, end] = phoneDeletionRange(value, selectionStart, event.key);
    event.currentTarget.setSelectionRange(start, end);
  }

  function applyMask(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const formatted = formatPhoneInput(input.value, input.selectionStart ?? input.value.length);
    input.value = formatted.value;
    input.setSelectionRange(formatted.caret, formatted.caret);
  }

  return (
    <TextFieldNext
      {...props}
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      placeholder={placeholder}
      maxLength={PHONE_MASK_MAX_LENGTH}
      onKeyDown={(event) => {
        extendDeletionOverSeparators(event);
        onKeyDown?.(event);
      }}
      onChange={(event) => {
        applyMask(event);
        onChange?.(event);
      }}
    />
  );
});
