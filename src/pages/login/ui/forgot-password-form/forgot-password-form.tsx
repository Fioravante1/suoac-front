"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";

import { useServerError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";
import { TextFieldNext } from "@/shared/ui/text-field-next";

import { requestPasswordResetAction } from "../../api";
import { passwordResetRequestSchema, type PasswordResetRequestFormValues } from "../../model";

import styles from "./forgot-password-form.module.css";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const SUBMIT_FAILED = "Não foi possível enviar o link agora. Tente novamente.";

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const { serverError, clearServerError, showServerError } = useServerError();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  async function onSubmit(values: PasswordResetRequestFormValues) {
    clearServerError();

    const result = await requestPasswordResetAction(values);

    if (result.status === "error") {
      showServerError(result.message, SUBMIT_FAILED);
      return;
    }

    setSentEmail(values.email);
  }

  return (
    <section className={styles.screen} aria-labelledby="forgot-password-title">
      <button type="button" className={styles.back} onClick={onBack} disabled={isSubmitting}>
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        Voltar
      </button>

      {!sentEmail && (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <header className={styles.header}>
            <h2 id="forgot-password-title" className={styles.title}>
              Recuperar senha
            </h2>
            <p className={styles.subtitle}>
              Informe o e-mail cadastrado. Enviaremos um link para criar uma nova senha.
            </p>
          </header>

          {serverError && (
            <p key={serverError} className={styles.error} role="alert">
              <CircleAlert size={17} strokeWidth={2} aria-hidden />
              {serverError}
            </p>
          )}

          <TextFieldNext
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            icon={<Mail size={18} strokeWidth={1.8} />}
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register("email")}
          />

          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {isSubmitting && <Spinner className={styles.spinner} size="small" />}
            {!isSubmitting && <Send size={18} strokeWidth={2.1} aria-hidden />}
            {isSubmitting ? "Enviando…" : "Enviar link"}
          </button>
        </form>
      )}

      {sentEmail && (
        <div className={styles.confirmation} role="status">
          <span className={styles.confirmationIcon} aria-hidden>
            <Send size={28} strokeWidth={1.9} />
          </span>
          <div className={styles.confirmationText}>
            <h2 id="forgot-password-title" className={styles.confirmationTitle}>
              Confira seu e-mail
            </h2>
            <p className={styles.subtitle}>
              Se <strong>{sentEmail}</strong> estiver cadastrado, você vai receber o link em alguns minutos. Verifique
              também a caixa de spam. O link será válido por 1 hora.
            </p>
          </div>
          <button type="button" className={styles.secondary} onClick={onBack}>
            Voltar para o login
          </button>
        </div>
      )}
    </section>
  );
}
