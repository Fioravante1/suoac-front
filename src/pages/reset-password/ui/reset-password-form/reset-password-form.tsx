"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Lock, MonitorSmartphone } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { routes } from "@/shared/config";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isPasswordCompliant, useServerError } from "@/shared/lib";
import { PasswordFieldNext } from "@/shared/ui/password-field-next";
import { PasswordStrengthMeter } from "@/shared/ui/password-strength-meter";
import { Spinner } from "@/shared/ui/spinner";

import { resetPasswordAction, type ResetPasswordResult } from "../../api";
import { resetPasswordSchema, type ResetPasswordFormValues, type TokenState } from "../../model";
import { TokenNotice } from "../token-notice";

import styles from "./reset-password-form.module.css";

interface ResetPasswordFormProps {
  /**
   * Token do link, lido da URL no servidor.
   *
   * Nao e campo do formulario: chega como propriedade e e repassado a action,
   * que o envia no corpo da requisicao.
   */
  token: string;
}

const SUBMIT_FAILED = "Não foi possível redefinir a senha agora. Tente novamente.";

/**
 * `redirect` numa Server Action chega ao cliente como **rejeicao**, depois de
 * o roteador ja ter aplicado a navegacao.
 *
 * Sem reconhece-la, o `handleSubmit` do React Hook Form a repropaga e ela vira
 * `unhandledrejection` no navegador: invisivel para quem usa a tela, mas um
 * alarme falso em todo sucesso para quem coleta erro de cliente.
 *
 * O digest e `NEXT_REDIRECT;<tipo>;<destino>;<status>;` — basta o prefixo, e
 * assim nao se importa modulo interno do Next.
 */
function isRedirectRejection(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;

  const { digest } = error as { digest: unknown };

  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  /** Token recusado no submit — o link morreu entre abrir a tela e enviar. */
  const [rejectedToken, setRejectedToken] = useState<Exclude<TokenState, "valid"> | null>(null);
  const { serverError, clearServerError, showServerError } = useServerError();
  /*
   * O formulario sai do DOM quando o token e recusado no envio, levando junto o
   * foco, que cai no `body`. Como o aviso tambem nao e anunciado — regiao viva
   * montada ja preenchida nao e lida —, quem usa leitor de tela nao recebe
   * nada. Mover o foco resolve as duas coisas: anuncia o conteudo e devolve o
   * ponto de leitura.
   *
   * Ref de callback em vez de efeito: ela roda na montagem do no, que e
   * exatamente o instante em que o resultado aparece.
   */
  const focusResult = useCallback((node: HTMLElement | null) => {
    node?.focus();
  }, []);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // `useWatch` em vez de `watch()`: o React Compiler nao memoiza o retorno de
  // `watch`, e o projeto inteiro ja segue este padrao.
  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  /*
   * A coincidencia e avaliada enquanto se digita, e nao so no submit: descobrir
   * que as duas senhas diferem depois de enviar obriga a redigitar as duas, ja
   * que nenhuma delas esta visivel.
   */
  const hasConfirmation = confirmPassword.length > 0;
  const passwordsMatch = hasConfirmation && newPassword === confirmPassword;
  const passwordsDiverge = hasConfirmation && !passwordsMatch;
  const isReady = isPasswordCompliant(newPassword) && passwordsMatch;

  function resolveMatchStatus() {
    if (passwordsMatch) return "valid" as const;
    if (passwordsDiverge) return "invalid" as const;
    return undefined;
  }

  const matchStatus = resolveMatchStatus();

  /*
   * Embaixo do campo entra so o que o indicador ao lado do rotulo nao cobre: a
   * confirmacao em branco. A divergencia ja esta dita la em cima, e repetir
   * seria o ruido que o `status` foi criado para evitar.
   */
  const confirmationError = hasConfirmation ? undefined : errors.confirmPassword?.message;

  async function onSubmit(values: ResetPasswordFormValues) {
    clearServerError();

    let result: ResetPasswordResult;

    try {
      result = await resetPasswordAction({ token, ...values });
    } catch (error) {
      // Sucesso: a action redirecionou e a navegacao ja esta em curso.
      if (isRedirectRejection(error)) return;

      throw error;
    }

    if (result.status === "token-rejected") {
      setRejectedToken(result.tokenState);
      return;
    }

    /*
     * So resta `error`: o sucesso nao volta da action, que termina em
     * `redirect` para a confirmacao.
     */
    showServerError(result.message, SUBMIT_FAILED);
  }

  if (rejectedToken) {
    return (
      <div ref={focusResult} tabIndex={-1} className={styles.result}>
        <TokenNotice state={rejectedToken} />
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="reset-password-title">
      <header className={styles.header}>
        <h2 id="reset-password-title" className={styles.title}>
          Crie uma nova senha
        </h2>
        <p className={styles.subtitle}>Escolha uma senha que você não usa em outros sites.</p>
      </header>

      {serverError && (
        <p key={serverError} className={styles.error} role="alert">
          <CircleAlert size={17} strokeWidth={2} aria-hidden />
          {serverError}
        </p>
      )}

      <div className={styles.passwordGroup}>
        <PasswordFieldNext
          label="Nova senha"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
          icon={<Lock size={18} strokeWidth={1.9} />}
          error={errors.newPassword?.message}
          disabled={isSubmitting}
          autoFocus
          {...register("newPassword")}
        />
        <PasswordStrengthMeter value={newPassword} />
      </div>

      <PasswordFieldNext
        label="Confirme a nova senha"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        placeholder="Repita a nova senha"
        icon={<Lock size={18} strokeWidth={1.9} />}
        error={confirmationError}
        /*
         * A borda acompanha o indicador ao lado do rotulo — verde ao coincidir,
         * vermelha ao divergir —, sem mensagem propria embaixo do campo, que
         * repetiria o que ja esta dito acima.
         */
        status={matchStatus}
        disabled={isSubmitting}
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

      {/*
        O desenho traz isto como caixa marcavel, mas a API nao aceita escolha: a
        redefinicao sempre encerra as outras sessoes. Controle que nao controla
        nada e pior que informacao — quem desmarcasse veria o sistema fazer o
        contrario do pedido. Ver SUC-26.
      */}
      <p className={styles.sessionNotice}>
        <MonitorSmartphone size={18} strokeWidth={1.9} aria-hidden />
        <span>
          <strong className={styles.sessionNoticeTitle}>Você sairá dos outros dispositivos</strong>
          Por segurança, as sessões abertas em outros aparelhos serão encerradas.
        </span>
      </p>

      <button type="submit" className={styles.submit} disabled={isSubmitting} data-ready={isReady}>
        {isSubmitting && <Spinner className={styles.spinner} size="small" />}
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </button>

      <Link href={routes.login} className={styles.back}>
        Voltar para a entrada
      </Link>
    </form>
  );
}
