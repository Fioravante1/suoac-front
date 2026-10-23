"use client";

import { Check, Lock } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { routes } from "@/shared/config";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, usePasswordTruncationNotice } from "@/shared/lib";
import { Checkbox } from "@/shared/ui/checkbox";
import { PasswordFieldNext } from "@/shared/ui/password-field-next";
import { PasswordStrengthMeter } from "@/shared/ui/password-strength-meter";

import type { AcceptInvitationFormValues } from "../../model";

import styles from "./invitation-password-step.module.css";

interface InvitationPasswordStepProps {
  disabled?: boolean;
}

/**
 * Etapa 2: senha com medidor, confirmacao em tempo real e aceite dos termos.
 *
 * Mesmo padrao da tela de nova senha, sem o aviso de sessoes: quem aceita o
 * convite ainda nao tem sessao em outro lugar para encerrar.
 */
export function InvitationPasswordStep({ disabled = false }: InvitationPasswordStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AcceptInvitationFormValues>();

  // `useWatch` em vez de `watch()`: o React Compiler nao memoiza o retorno de
  // `watch`, e o projeto inteiro ja segue este padrao.
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";
  const { truncationNotice, handlePaste } = usePasswordTruncationNotice(password);

  /*
   * A coincidencia e avaliada enquanto se digita, e nao so no envio: descobrir
   * que as duas senhas diferem depois de enviar obriga a redigitar as duas, ja
   * que nenhuma delas esta visivel.
   */
  const hasConfirmation = confirmPassword.length > 0;
  const passwordsMatch = hasConfirmation && password === confirmPassword;
  const passwordsDiverge = hasConfirmation && !passwordsMatch;

  function resolveMatchStatus() {
    if (passwordsMatch) return "valid" as const;
    if (passwordsDiverge) return "invalid" as const;
    return undefined;
  }

  /*
   * Embaixo do campo entra so o que o indicador ao lado do rotulo nao cobre: a
   * confirmacao em branco. A divergencia ja esta dita la em cima.
   */
  const confirmationError = hasConfirmation ? undefined : errors.confirmPassword?.message;

  return (
    <div className={styles.step}>
      <div className={styles.passwordGroup}>
        <PasswordFieldNext
          label="Senha"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
          icon={<Lock size={18} strokeWidth={1.9} />}
          error={errors.password?.message}
          /* O corte da colagem nao e erro de validacao: informa, nao interrompe. */
          notice={truncationNotice}
          disabled={disabled}
          autoFocus
          onPaste={handlePaste}
          {...register("password")}
        />
        <PasswordStrengthMeter value={password} />
      </div>

      <PasswordFieldNext
        label="Confirme a senha"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        placeholder="Repita a senha"
        icon={<Lock size={18} strokeWidth={1.9} />}
        error={confirmationError}
        status={resolveMatchStatus()}
        disabled={disabled}
        /*
         * A regiao viva fica sempre montada, mudando so o texto: leitor de tela
         * nao anuncia regiao que entra no DOM ja com conteudo, e o primeiro
         * veredito — o que mais importa — passaria em silencio.
         */
        labelAction={
          <span
            className={[styles.match, passwordsMatch && styles.matchOk, passwordsDiverge && styles.matchOff]
              .filter(Boolean)
              .join(" ")}
            role="status"
            aria-live="polite"
          >
            {passwordsMatch && <Check size={13} strokeWidth={3} aria-hidden />}
            {passwordsMatch && "As senhas coincidem"}
            {passwordsDiverge && "As senhas não coincidem"}
          </span>
        }
        {...register("confirmPassword")}
      />

      <div className={styles.terms}>
        <Checkbox
          disabled={disabled}
          aria-invalid={errors.terms ? true : undefined}
          /*
           * Num unico elemento: o rotulo do `Checkbox` e um flex, e texto e
           * links soltos virariam itens separados, espalhados pela linha.
           */
          label={
            <span>
              Li e aceito os{" "}
              <a href={routes.terms} className={styles.link} target="_blank" rel="noopener noreferrer">
                termos de uso
              </a>{" "}
              e a{" "}
              <a href={routes.privacy} className={styles.link} target="_blank" rel="noopener noreferrer">
                política de privacidade
              </a>
            </span>
          }
          {...register("terms")}
        />
        {errors.terms && (
          <span className={styles.termsError} role="alert">
            {errors.terms.message}
          </span>
        )}
      </div>
    </div>
  );
}
