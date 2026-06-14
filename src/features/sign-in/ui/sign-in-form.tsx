"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";

import { useServerError } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";
import { PasswordField } from "@/shared/ui/password-field";

import { signInSchema, type SignInFormValues } from "../model/sign-in-schema";
import { signInAction } from "../api/sign-in-action";
import styles from "./sign-in-form.module.css";

export function SignInForm() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams?.get("sessionExpired") === "true";
  const returnUrl = searchParams?.get("returnUrl") ?? null;

  const { serverError, clearServerError, showServerError } = useServerError();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    clearServerError();

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    if (returnUrl) {
      formData.append("returnUrl", returnUrl);
    }

    const result = await signInAction(undefined, formData);

    if (result?.error) {
      showServerError(result.error);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {sessionExpired && (
        <div className={styles.infoBanner} role="status">
          Sua sessão expirou. Faça login novamente para continuar.
        </div>
      )}

      {serverError && (
        <div className={styles.errorBanner} role="alert">
          {serverError}
        </div>
      )}

      <TextField
        label="E-mail"
        type="email"
        placeholder="seu.email@exemplo.com"
        error={errors.email?.message}
        startIcon={<Mail size={20} />}
        {...register("email")}
      />

      <PasswordField
        label="Senha"
        placeholder="••••••••"
        error={errors.password?.message}
        startIcon={<Lock size={20} />}
        {...register("password")}
      />

      <div className={styles.actions}>
        <a href="#" className={styles.forgotPassword}>
          Esqueceu a senha?
        </a>
      </div>

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className={styles.spinner} size={20} /> : "Entrar"}
      </Button>
    </form>
  );
}
