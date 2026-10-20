"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, KeyRound, Loader2 } from "lucide-react";

import { PASSWORD_MAX_LENGTH, useServerError } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { PasswordField } from "@/shared/ui/password-field";
import { PasswordStrengthMeter } from "@/shared/ui/password-strength-meter";

import { changePasswordSchema, type ChangePasswordFormValues } from "../model/change-password-schema";
import { changePasswordAction } from "../api/change-password-action";
import styles from "./change-password-form.module.css";

export function ChangePasswordForm() {
  const { serverError, clearServerError, showServerError } = useServerError();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  // `useWatch` em vez de `watch()`: o React Compiler nao memoiza o retorno de
  // `watch`, e o projeto inteiro ja segue este padrao. O campo nasce sem valor
  // padrao, por isso o `??`.
  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";

  const onSubmit = async (data: ChangePasswordFormValues) => {
    clearServerError();

    const formData = new FormData();
    formData.append("currentPassword", data.currentPassword);
    formData.append("newPassword", data.newPassword);
    formData.append("confirmPassword", data.confirmPassword);

    const result = await changePasswordAction(undefined, formData);

    if (result?.field) {
      setError(result.field, { type: "server", message: result.error });
      return;
    }

    if (result?.error) {
      showServerError(result.error);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <div className={styles.errorBanner} role="alert">
          {serverError}
        </div>
      )}

      <div className={styles.fieldGroup}>
        <PasswordField
          label="Senha atual"
          placeholder="••••••••"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          autoFocus
          error={errors.currentPassword?.message}
          startIcon={<Lock size={20} />}
          disabled={isSubmitting}
          {...register("currentPassword")}
        />
        <p className={styles.hint}>É a mesma senha que você usou para entrar agora.</p>
      </div>

      {/*
        O medidor fica junto do campo, no mesmo grupo: ele responde ao que esta
        sendo digitado ali. Sem ele, quem nao cumpre a politica so descobre o
        que falta ao submeter — e esta e a primeira tela de quem entra no
        sistema.
      */}
      <div className={styles.fieldGroup}>
        <PasswordField
          label="Nova senha"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.newPassword?.message}
          startIcon={<KeyRound size={20} />}
          disabled={isSubmitting}
          {...register("newPassword")}
        />
        <PasswordStrengthMeter value={newPassword} />
      </div>

      <PasswordField
        label="Confirmar nova senha"
        placeholder="••••••••"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        error={errors.confirmPassword?.message}
        startIcon={<KeyRound size={20} />}
        disabled={isSubmitting}
        {...register("confirmPassword")}
      />

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className={styles.spinner} size={20} /> : "Definir nova senha"}
      </Button>
    </form>
  );
}
