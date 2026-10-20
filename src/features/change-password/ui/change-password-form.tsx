"use client";

import { useState } from "react";
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

/**
 * `redirect` numa Server Action chega ao cliente como **rejeicao**, depois de
 * o roteador ja ter aplicado a navegacao.
 *
 * Sem reconhece-la, o `handleSubmit` do React Hook Form a repropaga e ela vira
 * `unhandledrejection` no navegador: invisivel para quem usa a tela, mas um
 * alarme falso em toda troca de senha bem-sucedida para quem coleta erro de
 * cliente.
 *
 * O digest e `NEXT_REDIRECT;<tipo>;<destino>;<status>;` — basta o prefixo, e
 * assim nao se importa modulo interno do Next.
 *
 * Duplicado da tela de redefinicao por link de proposito: `features` nao
 * importa de `pages`, e promover o guarda para `shared` e refatoracao de camada
 * compartilhada, que nao cabe num PR de correcao.
 */
function isRedirectRejection(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;

  const { digest } = error as { digest: unknown };

  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

const GENERIC_ERROR = "Não foi possível alterar a senha. Tente novamente.";

export function ChangePasswordForm() {
  const { serverError, clearServerError, showServerError } = useServerError();
  /*
   * Guardado separado de `isSubmitting`: o envio termina quando a action
   * responde, mas a navegacao para o painel comeca depois disso e o formulario
   * continua na tela. Reabrir o botao nessa janela permitiria um segundo envio
   * com a senha atual que acabou de deixar de valer — a API responderia `401` e
   * "Senha atual incorreta." apareceria em cima de uma troca bem-sucedida.
   */
  const [isRedirecting, setIsRedirecting] = useState(false);

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
  const isBusy = isSubmitting || isRedirecting;

  const onSubmit = async (data: ChangePasswordFormValues) => {
    clearServerError();

    const formData = new FormData();
    formData.append("currentPassword", data.currentPassword);
    formData.append("newPassword", data.newPassword);
    formData.append("confirmPassword", data.confirmPassword);

    let result: Awaited<ReturnType<typeof changePasswordAction>>;

    try {
      result = await changePasswordAction(undefined, formData);
    } catch (error) {
      // Sucesso: a action redirecionou para o painel e a navegacao ja esta em
      // curso. Nao ha resultado para interpretar.
      if (isRedirectRejection(error)) {
        setIsRedirecting(true);
        return;
      }

      showServerError(undefined, GENERIC_ERROR);
      return;
    }

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
          disabled={isBusy}
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
          disabled={isBusy}
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
        disabled={isBusy}
        {...register("confirmPassword")}
      />

      <Button type="submit" fullWidth disabled={isBusy}>
        {isBusy ? <Loader2 className={styles.spinner} size={20} /> : "Definir nova senha"}
      </Button>
    </form>
  );
}
