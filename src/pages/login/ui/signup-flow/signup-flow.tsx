"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { FormProvider, useForm, type Path } from "react-hook-form";

import { routes } from "@/shared/config";
import { useServerError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";

import { confirmCircuitSignupAction, submitCircuitSignupAction, type SignupConflict } from "../../api";
import { SignupStepCircuit } from "../signup-step-circuit";
import { SignupStepConfirmation } from "../signup-step-confirmation";
import { SignupStepCongregations } from "../signup-step-congregations";
import { SignupStepCoordinator } from "../signup-step-coordinator";
import { SignupStepSuccess } from "../signup-step-success";

import {
  SIGNUP_STEPS,
  SIGNUP_STEP_COUNT,
  buildSignupSummary,
  dropBlankCongregations,
  isSignupFieldPath,
  resolveSignupFieldStep,
  signupDefaultValues,
  signupSchema,
  type SignupFormValues,
  type SignupSummary,
} from "../../model";

import styles from "./signup-flow.module.css";

interface SignupFlowProps {
  /** Sai do autocadastro e volta para a tela de entrada. */
  onBack: () => void;
}

const ABANDON_WARNING = "Você tem um cadastro em andamento. Se sair agora, os dados preenchidos serão perdidos.";

/**
 * Autocadastro de circuito: as três etapas de preenchimento e a confirmação por
 * código de 6 dígitos.
 *
 * As etapas compartilham **um** formulário e **um** estado. Três formulários
 * independentes dariam três fontes de verdade e um problema de navegação para
 * trás — e manter o formulário vivo durante a confirmação permite voltar à
 * etapa 1 em "Corrigir e-mail" ou reenviar o rascunho sem redigitar nada.
 *
 * Nada é enviado antes do fim da etapa 3: a API guarda um rascunho quando ela é
 * concluída (SUC-31), e o código de 6 dígitos consolida o cadastro e já abre a
 * sessão (SUC-32 / SUC-37).
 */
export function SignupFlow({ onBack }: SignupFlowProps) {
  const router = useRouter();
  /*
   * A etapa é estado de controle da tela, não valor de campo, então vive em
   * `useState`. Todo valor que o usuário digita fica em React Hook Form — é o
   * que mantém o preenchimento ao navegar entre etapas, porque os campos das
   * etapas que saem de tela são desmontados e o formulário continua de pé.
   */
  const [stepIndex, setStepIndex] = useState(0);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<SignupSummary | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isServerCodeInvalid, setIsServerCodeInvalid] = useState(false);
  const [isServerCodeExpired, setIsServerCodeExpired] = useState(false);

  const advancingRef = useRef(false);
  const confirmingRef = useRef(false);
  const { serverError, clearServerError, showServerError } = useServerError();
  // Campo a focar quando a etapa que o contém terminar de montar.
  const pendingFocusRef = useRef<Path<SignupFormValues> | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: signupDefaultValues,
    /*
     * Explícito por ser do que o fluxo depende, embora seja o padrão do React
     * Hook Form: com `true`, trocar de etapa desmontaria os campos e descartaria
     * o que eles tinham, e voltar mostraria a etapa anterior em branco.
     */
    shouldUnregister: false,
  });

  const {
    formState: { isSubmitting, isDirty },
    getValues,
    setError,
    setFocus,
    setValue,
    trigger,
  } = form;

  /*
   * O formulário não passa por `handleSubmit` — o avanço valida uma etapa, não
   * o conjunto —, então `isSubmitting` fica sempre falso e não serve sozinho
   * para travar os botões nem para acender o rótulo de ocupado.
   */
  const isBusy = isSubmitting || isAdvancing || isConfirming || isResending || isRedirecting;
  const isSuccessPhase = completedSummary !== null;
  const isConfirmationPhase = !isSuccessPhase && confirmationEmail !== null;
  const isFormPhase = !isSuccessPhase && !isConfirmationPhase;

  const step = SIGNUP_STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === SIGNUP_STEP_COUNT - 1;

  /*
   * Cada etapa responde por si no JSX, em vez de uma cadeia de condições onde o
   * último caso só se entende por eliminação — regra de estilo do projeto.
   */
  const isCoordinatorStep = stepIndex === 0;
  const isCircuitStep = stepIndex === 1;
  const isCongregationsStep = stepIndex === 2;

  /*
   * Recarregar ou fechar a aba com dados preenchidos perde tudo. O navegador
   * não deixa escolher o texto do diálogo, mas deixa pedir a confirmação — é a
   * diferença entre perder o cadastro sem aviso e ser avisado.
   *
   * Consolidado o cadastro (`isSuccessPhase`), tudo já está salvo no servidor e
   * sair da aba não perde nada.
   */
  useEffect(() => {
    if (!isDirty || isSuccessPhase || isRedirecting) {
      return;
    }

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = ABANDON_WARNING;
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);

    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty, isSuccessPhase, isRedirecting]);

  /*
   * Foco no primeiro campo em conflito (ou no e-mail ao clicar em "Corrigir
   * e-mail"). Quando o campo está em outra etapa ou fora da confirmação, ele só
   * existe depois que a etapa monta, então o foco espera a troca.
   */
  useEffect(() => {
    if (!isFormPhase) {
      return;
    }

    const field = pendingFocusRef.current;

    if (!field) {
      return;
    }

    pendingFocusRef.current = null;
    setFocus(field);
  }, [stepIndex, isFormPhase, setFocus]);

  if (!step) {
    return null;
  }

  function clearConfirmationError() {
    clearServerError();
    setIsServerCodeInvalid(false);
    setIsServerCodeExpired(false);
  }

  /*
   * Linha em branco é só uma linha aberta e não usada: sai antes de validar e
   * de enviar, para o índice do erro da API ser o da tela.
   */
  function pruneCongregations(onlyOwnCongregation: boolean) {
    const congregations = getValues("congregations");
    const kept = onlyOwnCongregation ? congregations.slice(0, 1) : dropBlankCongregations(congregations);

    if (kept.length === congregations.length) {
      return;
    }

    setValue("congregations", kept);
  }

  /**
   * `onlyOwnCongregation` é o "Adicionar as outras depois": descarta as linhas
   * adicionais, preenchidas ou não, e conclui só com a congregação do
   * coordenador.
   */
  async function goToNextStep({ onlyOwnCongregation = false } = {}) {
    /*
     * Trava síncrona contra o clique repetido. `trigger` é assíncrono, e dois
     * cliques dentro da mesma espera leem o mesmo `stepIndex` e avançam duas
     * vezes — o usuário ia da etapa 1 para a 3, pulando a 2 sem nunca vê-la
     * nem validá-la.
     *
     * Precisa ser `ref`, não estado: dois cliques no mesmo tick enxergariam o
     * estado antigo no closure, e a janela continuaria aberta. O estado abaixo
     * existe só para desabilitar os botões.
     */
    if (advancingRef.current) {
      return;
    }

    advancingRef.current = true;
    setIsAdvancing(true);

    try {
      clearConfirmationError();

      if (isLastStep) {
        pruneCongregations(onlyOwnCongregation);
      }

      // Valida só os campos desta etapa: o formulário inteiro reprovaria por
      // campos que o usuário ainda não viu.
      const isStepValid = await trigger(step.fields.slice(), { shouldFocus: true });

      if (!isStepValid) {
        return;
      }

      if (isLastStep) {
        await submitSignup();
        return;
      }

      setStepIndex((current) => current + 1);
    } finally {
      advancingRef.current = false;
      setIsAdvancing(false);
    }
  }

  async function submitSignup() {
    const result = await submitCircuitSignupAction(getValues());

    if (result.status === "success") {
      clearConfirmationError();
      setConfirmationEmail(result.email);
      return;
    }

    showFailure(result.message, result.conflicts);
  }

  async function handleResendCode(): Promise<boolean> {
    if (advancingRef.current || confirmingRef.current) {
      return false;
    }

    advancingRef.current = true;
    setIsResending(true);

    try {
      clearConfirmationError();
      const result = await submitCircuitSignupAction(getValues());

      if (result.status === "success") {
        setConfirmationEmail(result.email);
        return true;
      }

      showFailure(result.message, result.conflicts);
      return false;
    } finally {
      advancingRef.current = false;
      setIsResending(false);
    }
  }

  async function handleConfirmCode(code: string) {
    if (!confirmationEmail || confirmingRef.current || advancingRef.current) {
      return;
    }

    confirmingRef.current = true;
    setIsConfirming(true);

    try {
      clearConfirmationError();
      const result = await confirmCircuitSignupAction({ email: confirmationEmail, code });

      if (result.status === "success") {
        setCompletedSummary(buildSignupSummary(getValues()));
        return;
      }

      if (result.status === "already-confirmed") {
        onBack();
        return;
      }

      if (result.status === "invalid-code") {
        setIsServerCodeInvalid(true);
        showServerError(result.message);
        return;
      }

      if (result.status === "expired-code") {
        setIsServerCodeExpired(true);
        showServerError(result.message);
        return;
      }

      if (result.status === "conflict") {
        showFailure(result.message, result.conflicts);
        return;
      }

      showServerError(result.message);
    } finally {
      confirmingRef.current = false;
      setIsConfirming(false);
    }
  }

  function handleEnterDashboard() {
    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);
    router.push(routes.dashboard);
  }

  /**
   * Conflito de campo vira erro no próprio campo, e o fluxo volta para a etapa
   * que tem o primeiro deles — o usuário corrige onde o erro está, e não numa
   * tela que não o mostra. O que não aponta campo (limite de tentativas, falha
   * da API) fica no aviso geral, que aparece em qualquer etapa.
   */
  function showFailure(message: string, conflicts: SignupConflict[]) {
    const fieldConflicts = conflicts.flatMap(({ field, message: fieldMessage }) =>
      isSignupFieldPath(field) ? [{ field, message: fieldMessage }] : [],
    );
    const otherConflict = conflicts.find((conflict) => !isSignupFieldPath(conflict.field));

    fieldConflicts.forEach(({ field, message: fieldMessage }) =>
      setError(field, { type: "server", message: fieldMessage }),
    );

    showServerError(otherConflict?.message ?? message);

    if (conflicts.length > 0) {
      setConfirmationEmail(null);
    }

    const first = fieldConflicts[0];
    const targetStep = first ? resolveSignupFieldStep(first.field) : null;

    if (!first || targetStep === null) {
      return;
    }

    if (targetStep === stepIndex && isFormPhase) {
      setFocus(first.field);
      return;
    }

    pendingFocusRef.current = first.field;
    setStepIndex(targetStep);
  }

  function goToPreviousStep() {
    clearConfirmationError();

    if (isConfirmationPhase) {
      pendingFocusRef.current = "coordinator.email";
      setConfirmationEmail(null);
      setStepIndex(0);
      return;
    }

    if (isFirstStep) {
      onBack();
      return;
    }

    setStepIndex((current) => current - 1);
  }

  const backLabel = resolveBackLabel(isConfirmationPhase, isFirstStep);

  return (
    <FormProvider {...form}>
      <section className={styles.screen} aria-labelledby="signup-title">
        {!isSuccessPhase && (
          <div className={styles.topbar}>
            <button type="button" className={styles.back} onClick={goToPreviousStep} disabled={isBusy}>
              <ArrowLeft size={16} strokeWidth={2} aria-hidden />
              {backLabel}
            </button>
            {isFormPhase && (
              <span className={styles.counter}>
                Etapa {stepIndex + 1} de {SIGNUP_STEP_COUNT}
              </span>
            )}
          </div>
        )}

        {isFormPhase && (
          <ol className={styles.progress} aria-hidden>
            {SIGNUP_STEPS.map((item, index) => (
              <li key={item.title} className={styles.track}>
                <span className={styles.fill} data-state={resolveSegmentState(index, stepIndex)} />
              </li>
            ))}
          </ol>
        )}

        {isSuccessPhase && (
          <SignupStepSuccess
            summary={completedSummary}
            isEnteringDashboard={isRedirecting}
            onEnterDashboard={handleEnterDashboard}
          />
        )}

        {isConfirmationPhase && (
          <SignupStepConfirmation
            email={confirmationEmail}
            serverError={serverError}
            isServerCodeInvalid={isServerCodeInvalid}
            isServerCodeExpired={isServerCodeExpired}
            isConfirming={isConfirming}
            isResending={isResending}
            onClearError={clearConfirmationError}
            onConfirm={handleConfirmCode}
            onResend={handleResendCode}
          />
        )}

        {isFormPhase && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void goToNextStep();
            }}
            noValidate
          >
            {/*
             * `key` por etapa em cabeçalho e campos: sem ela o React reaproveita
             * os nós, e a animação de troca não roda porque nada remontou.
             */}
            <header key={`header-${stepIndex}`} className={styles.header}>
              <h2 id="signup-title" className={styles.title}>
                {step.title}
              </h2>
              <p className={styles.subtitle}>{step.subtitle}</p>
            </header>

            {serverError && (
              <p key={serverError} className={styles.error} role="alert">
                <CircleAlert size={17} strokeWidth={2} aria-hidden />
                {serverError}
              </p>
            )}

            <div key={`step-${stepIndex}`} className={styles.step}>
              {isCoordinatorStep && <SignupStepCoordinator />}
              {isCircuitStep && <SignupStepCircuit />}
              {isCongregationsStep && <SignupStepCongregations />}
            </div>

            <button type="submit" className={styles.submit} disabled={isBusy}>
              {isBusy && <Spinner className={styles.spinner} size="small" />}
              {isBusy ? step.busyCta : step.cta}
            </button>

            {isCongregationsStep && (
              <button
                type="button"
                className={styles.skip}
                onClick={() => void goToNextStep({ onlyOwnCongregation: true })}
                disabled={isBusy}
              >
                Adicionar as outras depois
              </button>
            )}
          </form>
        )}
      </section>
    </FormProvider>
  );
}

function resolveBackLabel(isConfirmationPhase: boolean, isFirstStep: boolean): string {
  if (isConfirmationPhase) return "Corrigir e-mail";
  if (isFirstStep) return "Voltar para o login";
  return "Voltar";
}

/**
 * Estado de um segmento da barra de progresso.
 *
 * A etapa em curso fica pela metade, as anteriores cheias e as seguintes
 * vazias — é o que mostra avanço dentro da etapa atual em vez de só entre elas.
 * Nomeado em função em vez de ternário encadeado, conforme as regras de estilo.
 */
function resolveSegmentState(index: number, stepIndex: number): "filled" | "current" | "empty" {
  if (index < stepIndex) return "filled";
  if (index === stepIndex) return "current";
  return "empty";
}
