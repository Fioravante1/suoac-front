"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, KeyRound, Loader2 } from "lucide-react";

import { useServerError } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { PasswordField } from "@/shared/ui/password-field";

import { changePasswordSchema, type ChangePasswordFormValues } from "../model/change-password-schema";
import { changePasswordAction } from "../api/change-password-action";
import styles from "./change-password-form.module.css";

export function ChangePasswordForm() {
  const { serverError, clearServerError, showServerError } = useServerError();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

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
          autoFocus
          error={errors.currentPassword?.message}
          startIcon={<Lock size={20} />}
          disabled={isSubmitting}
          {...register("currentPassword")}
        />
        <p className={styles.hint}>É a mesma senha que você usou para entrar agora.</p>
      </div>

      <PasswordField
        label="Nova senha"
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        startIcon={<KeyRound size={20} />}
        disabled={isSubmitting}
        {...register("newPassword")}
      />

      <PasswordField
        label="Confirmar nova senha"
        placeholder="••••••••"
        autoComplete="new-password"
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
