"use client";

import { Check } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { PhoneFieldNext } from "@/shared/ui/phone-field-next";
import { TextFieldNext } from "@/shared/ui/text-field-next";

import type { AcceptInvitationFormValues } from "../../model";

import styles from "./invitation-details-step.module.css";

interface InvitationDetailsStepProps {
  /** E-mail do convite: vira o login e nao se edita aqui. */
  email: string;
  disabled?: boolean;
}

/**
 * Etapa 1: o convidado confere nome e celular que o coordenador do circuito
 * preencheu, e os corrige se for preciso.
 *
 * O envio de ambos e obrigatorio mesmo sem alteracao: e a confirmacao dos dados
 * pela propria pessoa. O e-mail e outra coisa — e o login, e quem o define e o
 * convite.
 */
export function InvitationDetailsStep({ email, disabled = false }: InvitationDetailsStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AcceptInvitationFormValues>();

  return (
    <div className={styles.step}>
      <TextFieldNext
        label="Nome completo"
        autoComplete="name"
        placeholder="Seu nome"
        error={errors.name?.message}
        disabled={disabled}
        {...register("name")}
      />

      <div className={styles.email}>
        <TextFieldNext
          label="E-mail"
          type="email"
          value={email}
          readOnly
          aria-describedby="invitation-email-help"
          className={styles.emailField}
          trailing={
            <span className={styles.verified}>
              <Check size={14} strokeWidth={2.4} aria-hidden />
              Verificado pelo convite
            </span>
          }
        />
        <span id="invitation-email-help" className={styles.help}>
          Será seu login. Para trocar, peça ao coordenador do arranjo de ônibus no circuito.
        </span>
      </div>

      <PhoneFieldNext
        label="Celular (WhatsApp)"
        error={errors.phone?.message}
        disabled={disabled}
        {...register("phone")}
      />
    </div>
  );
}
