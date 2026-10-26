"use client";

import { Mail, Phone, User } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_MASK_MAX_LENGTH,
  formatPhoneInput,
  usePasswordTruncationNotice,
} from "@/shared/lib";
import { PasswordFieldNext } from "@/shared/ui/password-field-next";
import { PasswordStrengthMeter } from "@/shared/ui/password-strength-meter";
import { TextFieldNext } from "@/shared/ui/text-field-next";

import type { SignupFormValues } from "../../model";

import styles from "./signup-step-coordinator.module.css";

/**
 * Etapa 1 do autocadastro: quem está cadastrando o circuito.
 *
 * Os campos são os que a API exige (SUC-37), e a validação já é a definitiva.
 */
export function SignupStepCoordinator() {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<SignupFormValues>();

  const phoneField = register("coordinator.phone");
  const password = useWatch({ control, name: "coordinator.password" });
  const { truncationNotice, handlePaste } = usePasswordTruncationNotice(password ?? "");

  return (
    <>
      <TextFieldNext
        label="Nome completo"
        autoComplete="name"
        placeholder="Seu nome"
        icon={<User size={18} strokeWidth={1.8} />}
        error={errors.coordinator?.name?.message}
        disabled={isSubmitting}
        {...register("coordinator.name")}
      />

      <TextFieldNext
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        icon={<Mail size={18} strokeWidth={1.8} />}
        error={errors.coordinator?.email?.message}
        disabled={isSubmitting}
        {...register("coordinator.email")}
      />

      <TextFieldNext
        label="Celular (WhatsApp)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(19) 99999-9999"
        maxLength={PHONE_MASK_MAX_LENGTH}
        icon={<Phone size={18} strokeWidth={1.8} />}
        error={errors.coordinator?.phone?.message}
        disabled={isSubmitting}
        {...phoneField}
        onKeyDown={selectPhoneDigitToDelete}
        onChange={(event) => {
          const input = event.currentTarget;
          const formatted = formatPhoneInput(input.value, input.selectionStart ?? input.value.length);
          input.value = formatted.value;
          input.setSelectionRange(formatted.caret, formatted.caret);

          return phoneField.onChange(event);
        }}
      />

      <div className={styles.passwordGroup}>
        <PasswordFieldNext
          label="Crie uma senha"
          autoComplete="new-password"
          placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
          /*
           * O teto é do campo, não só do schema: sem ele o medidor chega a
           * dizer "senha forte" numa senha de 120 caracteres que o avanço vai
           * recusar. Mesmo par de `maxLength` e aviso de colagem cortada da
           * redefinição por link.
           */
          maxLength={PASSWORD_MAX_LENGTH}
          notice={truncationNotice}
          onPaste={handlePaste}
          error={errors.coordinator?.password?.message}
          disabled={isSubmitting}
          {...register("coordinator.password")}
        />
        <PasswordStrengthMeter value={password} />
      </div>
    </>
  );
}

/** Ao apagar um separador, inclui o dígito vizinho na exclusão nativa. */
function selectPhoneDigitToDelete(event: KeyboardEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const start = input.selectionStart;
  const end = input.selectionEnd;

  if (start === null || start !== end || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === "Backspace") {
    let previous = start - 1;
    while (previous >= 0 && !/\d/.test(input.value.charAt(previous))) previous -= 1;
    input.setSelectionRange(Math.max(0, previous), start);
  }

  if (event.key === "Delete") {
    let next = start;
    while (next < input.value.length && !/\d/.test(input.value.charAt(next))) next += 1;
    input.setSelectionRange(start, Math.min(input.value.length, next + 1));
  }
}
