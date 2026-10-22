"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Lock, MonitorSmartphone } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { routes } from "@/shared/config";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isPasswordCompliant,
  isRedirectRejection,
  usePasswordTruncationNotice,
  useServerError,
} from "@/shared/lib";
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

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  /** Token recusado no submit — o link morreu entre abrir a tela e enviar. */
  const [rejectedToken, setRejectedToken] = useState<Exclude<TokenState, "valid"> | null>(null);
  /*
   * Guardado separado de `isSubmitting`: o envio termina quando a action
   * responde, mas a navegacao para a confirmacao comeca depois disso e o
   * formulario continua na tela enquanto ela acontece.
   */
  const [isRedirecting, setIsRedirecting] = useState(false);
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
  const { truncationNotice, handlePaste } = usePasswordTruncationNotice(newPassword);

  /*
   * A coincidencia e avaliada enquanto se digita, e nao so no submit: descobrir
   * que as duas senhas diferem depois de enviar obriga a redigitar as duas, ja
   * que nenhuma delas esta visivel.
   */
  const hasConfirmation = confirmPassword.length > 0;
  const passwordsMatch = hasConfirmation && newPassword === confirmPassword;
  const passwordsDiverge = hasConfirmation && !passwordsMatch;
  const isReady = isPasswordCompliant(newPassword) && passwordsMatch;
  /*
   * Fechado desde o clique ate a tela trocar. Reabrir durante a navegacao
   * custaria caro: um segundo envio reenviaria o token ja consumido, o backend
   * responderia `409` e "Este link ja foi usado" tomaria o lugar da
   * confirmacao, na cara de quem acabou de redefinir a senha.
   */
  const isBusy = isSubmitting || isRedirecting;

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
      if (isRedirectRejection(error)) {
        setIsRedirecting(true);
        return;
      }

      /*
       * Falha antes de a action responder — conexao caida, deploy no meio da
       * requisicao. Nao ha `result` para interpretar, e relancar aqui deixaria
       * a tela muda: o `handleSubmit` repropaga, a rejeicao morre como
       * `unhandledrejection` e quem usa ve o botao voltar ao normal sem
       * nenhuma mensagem, sem saber se a senha mudou.
       */
      showServerError(null, SUBMIT_FAILED);
      return;
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
          /* O corte da colagem nao e erro de validacao: informa, nao interrompe. */
          notice={truncationNotice}
          disabled={isBusy}
          autoFocus
          onPaste={handlePaste}
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
        disabled={isBusy}
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

      <button type="submit" className={styles.submit} disabled={isBusy} data-ready={isReady}>
        {isBusy && <Spinner className={styles.spinner} size="small" />}
        {isBusy ? "Salvando…" : "Salvar nova senha"}
      </button>

      <Link href={routes.login} className={styles.back}>
        Voltar para a entrada
      </Link>
    </form>
  );
}
