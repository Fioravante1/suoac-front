"use client";

import { Mail, Phone, User } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { PHONE_MASK_MAX_LENGTH, formatPhone } from "@/shared/lib";
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
        inputMode="tel"
        autoComplete="tel"
        placeholder="(19) 99999-9999"
        maxLength={PHONE_MASK_MAX_LENGTH}
        icon={<Phone size={18} strokeWidth={1.8} />}
        error={errors.coordinator?.phone?.message}
        disabled={isSubmitting}
        {...phoneField}
        onChange={(event) => {
          /*
           * Formata no caminho entre a tecla e o formulário: o que o campo
           * mostra e o que o React Hook Form guarda são o mesmo valor
           * mascarado. O schema valida contando dígitos, então a máscara não
           * muda o que é aceito, e o envio normaliza para dígitos.
           */
          event.target.value = formatPhone(event.target.value);

          return phoneField.onChange(event);
        }}
      />

      <div className={styles.passwordGroup}>
        <PasswordFieldNext
          label="Crie uma senha"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          error={errors.coordinator?.password?.message}
          disabled={isSubmitting}
          {...register("coordinator.password")}
        />
        <PasswordStrengthMeter value={password} barsOnly />
      </div>
    </>
  );
}
