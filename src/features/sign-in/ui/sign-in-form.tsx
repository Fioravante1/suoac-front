"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

import { signInSchema, type SignInFormValues } from "../model/sign-in-schema";
import { signInAction } from "../api/sign-in-action";
import styles from "./sign-in-form.module.css";

export function SignInForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    setServerError(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    const result = await signInAction(undefined, formData);

    if (result?.error) {
      setServerError(result.error);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
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

      <TextField
        label="Senha"
        type="password"
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
