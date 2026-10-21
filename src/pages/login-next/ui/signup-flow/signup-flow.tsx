"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";

import { useServerError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";

import { SignupStepCircuit } from "../signup-step-circuit";
import { SignupStepCongregations } from "../signup-step-congregations";
import { SignupStepCoordinator } from "../signup-step-coordinator";

import { SIGNUP_STEPS, SIGNUP_STEP_COUNT, signupDefaultValues, signupSchema, type SignupFormValues } from "../../model";

import styles from "./signup-flow.module.css";

interface SignupFlowProps {
  /** Sai do autocadastro e volta para a tela de entrada. */
  onBack: () => void;
}

const ABANDON_WARNING = "Você tem um cadastro em andamento. Se sair agora, os dados preenchidos serão perdidos.";

/**
 * Autocadastro de circuito: o chassi das três etapas.
 *
 * As etapas compartilham **um** formulário e **um** estado. Três formulários
 * independentes dariam três fontes de verdade e um problema de navegação para
 * trás — por isso o chassi vem antes do acabamento.
 *
 * Os campos já são os definitivos, com a validação definitiva; o que falta é o
 * acabamento da etapa seguinte: linhas de congregação que se adicionam e
 * removem, com envio final e tratamento dos conflitos da API (SUC-31).
 *
 * Nada é enviado antes do fim: a API guarda um rascunho só quando a etapa 3 é
 * concluída, e é o código de 6 dígitos que consolida o cadastro (SUC-37). Como
 * consequência, **recarregar a página perde o preenchimento** — não há rascunho
 * no servidor para retomar. O aviso de saída existe por isso.
 */
export function SignupFlow({ onBack }: SignupFlowProps) {
  /*
   * A etapa é estado de controle da tela, não valor de campo, então vive em
   * `useState`. Todo valor que o usuário digita fica em React Hook Form — é o
   * que mantém o preenchimento ao navegar entre etapas, porque os campos das
   * etapas que saem de tela são desmontados e o formulário continua de pé.
   */
  const [stepIndex, setStepIndex] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const { serverError, clearServerError } = useServerError();

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
    trigger,
  } = form;

  /*
   * O formulário não passa por `handleSubmit` — o avanço valida uma etapa, não
   * o conjunto —, então `isSubmitting` fica sempre falso e não serve sozinho
   * para travar os botões nem para acender o rótulo de ocupado.
   */
  const isBusy = isSubmitting || isAdvancing;

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
   */
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = ABANDON_WARNING;
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);

    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  if (!step) {
    return null;
  }

  async function goToNextStep() {
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
      clearServerError();

      // Valida só os campos desta etapa: o formulário inteiro reprovaria por
      // campos que o usuário ainda não viu.
      const isStepValid = await trigger(step.fields.slice(), { shouldFocus: true });

      if (!isStepValid) {
        return;
      }

      if (isLastStep) {
        // O envio para `POST /auth/circuit-signups` chega no SUC-31, junto da
        // etapa que o dispara. Até lá o fluxo valida as três etapas e para aqui.
        return;
      }

      setStepIndex((current) => current + 1);
    } finally {
      advancingRef.current = false;
      setIsAdvancing(false);
    }
  }

  function goToPreviousStep() {
    clearServerError();

    if (isFirstStep) {
      onBack();
      return;
    }

    setStepIndex((current) => current - 1);
  }

  const backLabel = isFirstStep ? "Voltar para o login" : "Voltar";

  return (
    <FormProvider {...form}>
      <section className={styles.screen} aria-labelledby="signup-title">
        <div className={styles.topbar}>
          <button type="button" className={styles.back} onClick={goToPreviousStep} disabled={isBusy}>
            <ArrowLeft size={16} strokeWidth={2} aria-hidden />
            {backLabel}
          </button>
          <span className={styles.counter}>
            Etapa {stepIndex + 1} de {SIGNUP_STEP_COUNT}
          </span>
        </div>

        <ol className={styles.progress} aria-hidden>
          {SIGNUP_STEPS.map((item, index) => (
            <li key={item.title} className={styles.track}>
              <span className={styles.fill} data-state={resolveSegmentState(index, stepIndex)} />
            </li>
          ))}
        </ol>

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
        </form>
      </section>
    </FormProvider>
  );
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
