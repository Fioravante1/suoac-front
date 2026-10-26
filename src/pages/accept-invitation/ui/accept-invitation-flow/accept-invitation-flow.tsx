"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, CircleAlert } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { Invitation } from "@/entities/invitation";
import { formatPhone, getFirstName, isPasswordCompliant, isRedirectRejection, useServerError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";

import { acceptInvitationAction } from "../../api";
import {
  DETAILS_STEP_FIELDS,
  acceptInvitationDetailsSchema,
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
  type InvitationRejection,
} from "../../model";
import { InvitationDeclineStep } from "../invitation-decline-step";
import { InvitationDetailsStep } from "../invitation-details-step";
import { InvitationNotice } from "../invitation-notice";
import { InvitationPasswordStep } from "../invitation-password-step";

import styles from "./accept-invitation-flow.module.css";

interface AcceptInvitationFlowProps {
  /** Token do link, lido da URL no servidor. Nao e campo do formulario: a action o envia. */
  token: string;
  invitation: Invitation;
  /** Recusa gravada: quem monta a pagina troca o fluxo pela confirmacao e muda o selo do cartao. */
  onDeclined: () => void;
}

type FlowView = "details" | "password" | "decline";

const STEPS = 2;
const SUBMIT_FAILED = "Não foi possível concluir o cadastro agora. Tente novamente.";

/**
 * Fluxo de aceite do convite (SUC-27), em duas etapas — dados e senha — mais a
 * saida de recusa.
 *
 * Um unico formulario cobre as duas etapas: a primeira so avanca com nome e
 * celular validos, e a senha so e pedida depois de o convidado confirmar quem
 * e. Voltar nao perde o que foi digitado.
 */
export function AcceptInvitationFlow({ token, invitation, onDeclined }: AcceptInvitationFlowProps) {
  const [view, setView] = useState<FlowView>("details");
  /** Convite que deixou de servir entre abrir a tela e enviar: o formulario cede lugar ao aviso. */
  const [rejection, setRejection] = useState<InvitationRejection | null>(null);
  /*
   * Guardado separado de `isSubmitting`: o envio termina quando a action
   * responde, mas a navegacao para as boas-vindas comeca depois disso e o
   * formulario continua na tela enquanto ela acontece. Reabrir nesse intervalo
   * custaria caro: um segundo envio reenviaria um convite ja consumido.
   */
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { serverError, clearServerError, showServerError } = useServerError();
  /*
   * O formulario sai do DOM quando o convite e recusado no envio, levando junto
   * o foco, que cai no `body`. Mover o foco para o aviso anuncia o conteudo e
   * devolve o ponto de leitura a quem usa leitor de tela. Ref de callback em
   * vez de efeito: roda na montagem do no, que e quando o resultado aparece.
   */
  const focusResult = useCallback((node: HTMLElement | null) => {
    node?.focus();
  }, []);

  const form = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    mode: "onTouched",
    defaultValues: {
      name: invitation.name,
      phone: formatPhone(invitation.phone ?? ""),
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });
  const {
    control,
    handleSubmit,
    trigger,
    formState: { isSubmitting },
  } = form;

  const name = useWatch({ control, name: "name" }) ?? "";
  const phone = useWatch({ control, name: "phone" }) ?? "";
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";
  const hasAcceptedTerms = useWatch({ control, name: "terms" }) ?? false;

  const isBusy = isSubmitting || isRedirecting;
  const firstName = getFirstName(invitation.name);
  // Convite sem nome utilizavel nao pode abrir em "Ola, !".
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  const isDetails = view === "details";
  const isPassword = view === "password";
  const areDetailsReady = acceptInvitationDetailsSchema.safeParse({ name, phone }).success;
  const isPasswordReady = isPasswordCompliant(password) && password === confirmPassword && hasAcceptedTerms;
  const isReady = isDetails ? areDetailsReady : isPasswordReady;
  const currentStep = isDetails ? 1 : 2;

  async function advance() {
    if (await trigger([...DETAILS_STEP_FIELDS])) {
      clearServerError();
      setView("password");
    }
  }

  async function submit(values: AcceptInvitationFormValues) {
    clearServerError();

    let result: Awaited<ReturnType<typeof acceptInvitationAction>>;

    try {
      result = await acceptInvitationAction({
        token,
        name: values.name,
        phone: values.phone,
        password: values.password,
      });
    } catch (error) {
      // Sucesso: a action redirecionou para as boas-vindas e a navegacao ja esta em curso.
      if (isRedirectRejection(error)) {
        setIsRedirecting(true);
        return;
      }

      /*
       * Falha antes de a action responder — conexao caida, deploy no meio da
       * requisicao. Relancar deixaria a tela muda: o botao voltaria ao normal
       * sem nenhuma mensagem, sem a pessoa saber se a conta foi criada.
       */
      showServerError(null, SUBMIT_FAILED);
      return;
    }

    if (result.status === "rejected") {
      setRejection(result.rejection);
      return;
    }

    // So resta `error`: o sucesso nao volta da action, que termina em `redirect`.
    showServerError(result.message, SUBMIT_FAILED);
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Enter na primeira etapa avanca, em vez de enviar o formulario incompleto.
    if (isDetails) {
      void advance();
      return;
    }

    void handleSubmit(submit)(event);
  }

  if (rejection) {
    return (
      <div ref={focusResult} tabIndex={-1} className={styles.result}>
        <InvitationNotice rejection={rejection} token={token} />
      </div>
    );
  }

  if (view === "decline") {
    return (
      <InvitationDeclineStep
        token={token}
        invitedBy={invitation.invitedBy}
        congregation={invitation.congregation}
        onBack={() => setView("details")}
        onDeclined={onDeclined}
        onRejected={setRejection}
      />
    );
  }

  return (
    <FormProvider {...form}>
      <form className={styles.form} onSubmit={handleFormSubmit} noValidate aria-labelledby="accept-invitation-title">
        <div className={styles.topbar}>
          {isPassword && (
            <button type="button" className={styles.back} onClick={() => setView("details")} disabled={isBusy}>
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              Voltar
            </button>
          )}
          <span className={styles.counter}>
            Etapa {currentStep} de {STEPS}
          </span>
        </div>

        <div className={styles.progress} aria-hidden>
          {Array.from({ length: STEPS }, (_, index) => (
            <span key={index} className={styles.track}>
              <span className={styles.fill} data-filled={currentStep >= index + 1} />
            </span>
          ))}
        </div>

        <header className={styles.header}>
          <h2 id="accept-invitation-title" className={styles.title}>
            {isDetails && greeting}
            {isPassword && "Crie sua senha"}
          </h2>
          <p className={styles.subtitle}>
            {isDetails &&
              "Confira os dados que o coordenador do arranjo de ônibus no circuito preencheu. Corrija o que for preciso."}
            {isPassword && `Você vai usar o e-mail ${invitation.email} e esta senha para entrar.`}
          </p>
        </header>

        {serverError && (
          <p key={serverError} className={styles.error} role="alert">
            <CircleAlert size={17} strokeWidth={2} aria-hidden />
            {serverError}
          </p>
        )}

        {isDetails && <InvitationDetailsStep email={invitation.email} disabled={isBusy} />}
        {isPassword && <InvitationPasswordStep disabled={isBusy} />}

        <button type="submit" className={styles.submit} disabled={isBusy} data-ready={isReady}>
          {isBusy && <Spinner className={styles.spinner} size="small" />}
          {isDetails && "Continuar"}
          {isPassword && !isBusy && "Aceitar convite e entrar"}
          {isPassword && isBusy && "Ativando acesso…"}
        </button>

        {isDetails && (
          <p className={styles.decline}>
            Não é você?{" "}
            <button type="button" className={styles.declineLink} onClick={() => setView("decline")}>
              Recusar convite
            </button>
          </p>
        )}
      </form>
    </FormProvider>
  );
}
