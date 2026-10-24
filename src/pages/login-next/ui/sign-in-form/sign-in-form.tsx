"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronRight, CircleAlert, Lock, Mail, Plus } from "lucide-react";

import { useServerError } from "@/shared/lib";
import { Checkbox } from "@/shared/ui/checkbox";
import { PasswordFieldNext } from "@/shared/ui/password-field-next";
import { TextFieldNext } from "@/shared/ui/text-field-next";

import { signInAction } from "../../api";
import { signInSchema, type SignInFormValues } from "../../model";

import styles from "./sign-in-form.module.css";

interface SignInFormProps {
  /**
   * Abre a recuperacao de senha. Opcional porque a tela de recuperacao e o card
   * seguinte da fatia (SUC-25); sem ela, o controle aparece desabilitado em vez
   * de prometer uma navegacao que nao acontece.
   */
  onForgotPassword?: () => void;
  /**
   * Abre o autocadastro de circuito. Segue opcional porque o controle precisa
   * aparecer desabilitado, e nao sumir, quando quem monta a tela nao oferece a
   * navegacao — mesma razao do controle de recuperacao.
   */
  onSignUp?: () => void;
}

const SUBMIT_FAILED = "Não foi possível entrar agora. Tente novamente.";

export function SignInForm({ onForgotPassword, onSignUp }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams?.get("sessionExpired") === "true";
  const returnUrl = searchParams?.get("returnUrl") ?? null;

  const { serverError, clearServerError, showServerError } = useServerError();
  // Guardado separado de `isSubmitting`: o cumprimento precisa continuar na tela
  // durante a navegacao, que acontece depois de o envio terminar.
  const [greeting, setGreeting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    // Valida ao sair do campo e, dai em diante, a cada tecla: avisar do erro no
    // primeiro caractere digitado seria implicancia.
    mode: "onTouched",
    // `rememberMe` desmarcado: o controle esta desabilitado (ver abaixo).
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  /*
   * Os tres estados do botao, nomeados e exclusivos entre si. Cada um responde
   * por si no JSX, em vez de uma cadeia de condicoes encadeadas onde o ultimo
   * caso so se entende depois de descartar os anteriores.
   */
  const isWelcoming = greeting !== null;
  const isChecking = isSubmitting && !isWelcoming;
  const isIdle = !isChecking && !isWelcoming;

  const isBusy = isChecking || isWelcoming;

  async function onSubmit(values: SignInFormValues) {
    clearServerError();

    const result = await signInAction({
      email: values.email,
      password: values.password,
      returnUrl,
    });

    if (result.status === "error") {
      showServerError(result.message, SUBMIT_FAILED);
      return;
    }

    setGreeting(result.firstName);
    router.push(result.redirectTo);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.title}>Entrar</h2>
        <p className={styles.subtitle}>
          Acesso para coordenadores do arranjo de ônibus no circuito e nas congregações.
        </p>
      </header>

      {sessionExpired && !serverError && (
        <p className={styles.notice} role="status">
          Sua sessão expirou. Entre novamente para continuar.
        </p>
      )}

      {serverError && (
        // `key` força a remontagem a cada erro: sem ela, errar a senha duas
        // vezes seguidas não repetiria o balanço — a animação só roda ao montar.
        <p key={serverError} className={styles.error} role="alert">
          <CircleAlert size={17} strokeWidth={2} aria-hidden />
          {serverError}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.fields}>
          <TextFieldNext
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            icon={<Mail size={18} strokeWidth={1.8} />}
            error={errors.email?.message}
            disabled={isBusy}
            {...register("email")}
          />

          <PasswordFieldNext
            label="Senha"
            autoComplete="current-password"
            placeholder="Sua senha"
            icon={<Lock size={18} strokeWidth={1.8} />}
            error={errors.password?.message}
            disabled={isBusy}
            labelAction={
              <button
                type="button"
                className={styles.inlineLink}
                onClick={onForgotPassword}
                disabled={!onForgotPassword}
              >
                Esqueci a senha
              </button>
            }
            {...register("password")}
          />

          {/*
           * "Manter conectado" espera a API de sessao estendida (SUC-39), que ainda
           * nao existe. Ate la o controle fica desmarcado e desabilitado (SUC-44),
           * como "Esqueci a senha" quando nao tem para onde ir: marcado e ignorado
           * em silencio, ele prometeria uma sessao mais longa que ninguem entrega.
           *
           * Para devolver o controle, o SUC-39 muda tres pontos juntos: aqui, o
           * valor padrao (`true`, como no desenho) e o `disabled`; o `onSubmit`,
           * que passa a enviar `rememberMe`; e `signInAction`, que hoje o fixa em
           * `false`. Mudar so um deles deixaria um controle ativo que nao faz nada.
           */}
          <Checkbox label="Manter conectado neste computador" disabled {...register("rememberMe")} />
        </div>

        <button
          type="submit"
          className={[styles.submit, isWelcoming && styles.submitDone].filter(Boolean).join(" ")}
          disabled={isBusy}
        >
          {isIdle && (
            <span className={styles.submitLabel}>
              Entrar
              <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
            </span>
          )}

          {isChecking && (
            <span className={styles.submitLabel}>
              <span className={styles.spinner} aria-hidden />
              Verificando…
            </span>
          )}

          {isWelcoming && (
            <span className={styles.submitLabelDone}>
              <Check size={20} strokeWidth={2.6} aria-hidden />
              Bem-vindo, {greeting}
            </span>
          )}
        </button>
      </form>

      <div className={styles.aside}>
        <div className={styles.invite}>
          <span className={styles.inviteTitle}>Recebeu um convite?</span>
          <span className={styles.inviteText}>
            Coordenadores das congregações entram pelo link enviado por e-mail ou WhatsApp.
          </span>
        </div>

        <button type="button" className={styles.signUp} onClick={onSignUp} disabled={!onSignUp}>
          <span className={styles.signUpIcon} aria-hidden>
            <Plus size={18} strokeWidth={2} />
          </span>
          <span className={styles.signUpText}>
            <span className={styles.signUpTitle}>Seu circuito ainda não usa o SUOAC?</span>
            <span className={styles.signUpSubtitle}>Cadastre o circuito em poucos minutos</span>
          </span>
          <ChevronRight className={styles.signUpChevron} size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
