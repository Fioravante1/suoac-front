"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

import { signInSchema, type SignInFormValues } from "../model/sign-in-schema";
import styles from "./sign-in-form.module.css";

export function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    // TODO: Replace with real API call
    console.log("Form data:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Login simulado com sucesso!");
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
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
