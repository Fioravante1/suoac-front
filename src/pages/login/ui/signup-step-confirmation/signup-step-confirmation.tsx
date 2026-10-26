"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { CircleAlert } from "lucide-react";

import { Spinner } from "@/shared/ui/spinner";

import {
  CIRCUIT_SIGNUP_CODE_LENGTH,
  CIRCUIT_SIGNUP_CODE_TTL_MINUTES,
  CIRCUIT_SIGNUP_RESEND_COOLDOWN_SECONDS,
  extractCodeDigits,
  formatResendCountdown,
} from "../../model";

import styles from "./signup-step-confirmation.module.css";

interface SignupStepConfirmationProps {
  /** E-mail para onde o código de 6 dígitos foi enviado. */
  email: string;
  /** Mensagem de erro vinda da confirmação ou do reenvio na API. */
  serverError: string | null;
  /** Quando `true`, destaca as 6 caixas como inválidas (ex.: `400` código incorreto). */
  isServerCodeInvalid?: boolean;
  /** Quando `true`, o código expirou (`410`) e o botão de reenviar é liberado na hora. */
  isServerCodeExpired?: boolean;
  /** Confirmação em andamento (`POST /auth/circuit-signups/confirmations`). */
  isConfirming: boolean;
  /** Reenvio em andamento (`POST /auth/circuit-signups`). */
  isResending: boolean;
  /** Limpa o erro de servidor ao editar o código ou pedir novo envio. */
  onClearError: () => void;
  /** Submete o código completo de 6 dígitos. */
  onConfirm: (code: string) => Promise<void> | void;
  /** Pede o reenvio do código e devolve `true` quando a API aceitou (`202`). */
  onResend: () => Promise<boolean>;
}

const INCOMPLETE_CODE_ERROR = "Digite os 6 dígitos do código.";

function createEmptyDigits(): string[] {
  return Array.from({ length: CIRCUIT_SIGNUP_CODE_LENGTH }, () => "");
}

/**
 * Etapa de confirmação de e-mail por código de 6 dígitos (SUC-32).
 *
 * Usa 6 `<input>` reais agrupados em `<fieldset>`/`<legend>` para que cada
 * caixa seja focável por clique e teclado e anunciada em conjunto por leitores
 * de tela. Colar os 6 dígitos distribui pelas caixas e dispara a confirmação
 * automaticamente.
 */
export function SignupStepConfirmation({
  email,
  serverError,
  isServerCodeInvalid = false,
  isServerCodeExpired = false,
  isConfirming,
  isResending,
  onClearError,
  onConfirm,
  onResend,
}: SignupStepConfirmationProps) {
  const [digits, setDigits] = useState<string[]>(createEmptyDigits);
  const [localError, setLocalError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(CIRCUIT_SIGNUP_RESEND_COOLDOWN_SECONDS);
  const [hasResent, setHasResent] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const fieldErrorId = useId();

  const isBusy = isConfirming || isResending;
  const effectiveCooldown = isServerCodeExpired ? 0 : cooldownSeconds;
  const isCoolingDown = effectiveCooldown > 0;
  const hasCodeError = localError !== null || isServerCodeInvalid;

  /* Estados nomeados do controle de reenvio — regra de estilo do projeto. */
  const showResendingLabel = isResending;
  const showCooldownLabel = !isResending && isCoolingDown;
  const showReadyResendLabel = !isResending && !isCoolingDown;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!isCoolingDown) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  function focusBox(index: number) {
    const clampedIndex = Math.max(0, Math.min(CIRCUIT_SIGNUP_CODE_LENGTH - 1, index));
    inputRefs.current[clampedIndex]?.focus();
  }

  function clearFeedbackOnEdit() {
    setLocalError(null);
    setHasResent(false);

    if (serverError !== null || isServerCodeInvalid || isServerCodeExpired) {
      onClearError();
    }
  }

  function distributeAndFocus(startIndex: number, incomingDigits: string, shouldAutoSubmit: boolean) {
    const origin = incomingDigits.length >= CIRCUIT_SIGNUP_CODE_LENGTH ? 0 : startIndex;
    const nextDigits = [...digits];

    incomingDigits.split("").forEach((char, offset) => {
      const targetIndex = origin + offset;

      if (targetIndex < CIRCUIT_SIGNUP_CODE_LENGTH) {
        nextDigits[targetIndex] = char;
      }
    });

    setDigits(nextDigits);

    const firstEmptyIndex = nextDigits.findIndex((digit) => digit === "");
    const targetFocusIndex = firstEmptyIndex === -1 ? CIRCUIT_SIGNUP_CODE_LENGTH - 1 : firstEmptyIndex;
    focusBox(targetFocusIndex);

    const joinedCode = nextDigits.join("");
    const isComplete = joinedCode.length === CIRCUIT_SIGNUP_CODE_LENGTH && firstEmptyIndex === -1;

    if (shouldAutoSubmit && isComplete && !isBusy) {
      void onConfirm(joinedCode);
    }
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const cleaned = extractCodeDigits(event.currentTarget.value);
    clearFeedbackOnEdit();

    if (cleaned.length === 0) {
      setDigits((current) => current.map((digit, itemIndex) => (itemIndex === index ? "" : digit)));
      return;
    }

    if (cleaned.length > 1) {
      distributeAndFocus(index, cleaned, false);
      return;
    }

    setDigits((current) => current.map((digit, itemIndex) => (itemIndex === index ? cleaned : digit)));
    focusBox(index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < CIRCUIT_SIGNUP_CODE_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
      return;
    }

    const currentDigit = digits[index] ?? "";

    if (event.key === "Backspace" && currentDigit !== "") {
      event.preventDefault();
      clearFeedbackOnEdit();
      setDigits((current) => current.map((digit, itemIndex) => (itemIndex === index ? "" : digit)));
      return;
    }

    if (event.key === "Backspace" && currentDigit === "" && index > 0) {
      event.preventDefault();
      clearFeedbackOnEdit();
      setDigits((current) => current.map((digit, itemIndex) => (itemIndex === index - 1 ? "" : digit)));
      focusBox(index - 1);
      return;
    }

    const isPlainDigitOverwrite =
      /^\d$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey && currentDigit !== "";

    if (isPlainDigitOverwrite) {
      event.preventDefault();
      clearFeedbackOnEdit();
      setDigits((current) => current.map((digit, itemIndex) => (itemIndex === index ? event.key : digit)));
      focusBox(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedDigits = extractCodeDigits(event.clipboardData.getData("text"));

    if (pastedDigits.length === 0) {
      return;
    }

    clearFeedbackOnEdit();
    distributeAndFocus(index, pastedDigits, true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    const joinedCode = digits.join("");
    const firstEmptyIndex = digits.findIndex((digit) => digit === "");

    if (firstEmptyIndex !== -1 || joinedCode.length < CIRCUIT_SIGNUP_CODE_LENGTH) {
      setLocalError(INCOMPLETE_CODE_ERROR);
      focusBox(firstEmptyIndex === -1 ? 0 : firstEmptyIndex);
      return;
    }

    setLocalError(null);
    void onConfirm(joinedCode);
  }

  async function handleResend() {
    if (isBusy || isCoolingDown) {
      return;
    }

    setLocalError(null);
    setHasResent(false);
    onClearError();

    const resent = await onResend();

    if (!resent) {
      return;
    }

    setDigits(createEmptyDigits());
    setCooldownSeconds(CIRCUIT_SIGNUP_RESEND_COOLDOWN_SECONDS);
    setHasResent(true);
    focusBox(0);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <header className={styles.header}>
        <h2 id="signup-title" className={styles.title}>
          Confirme seu e-mail
        </h2>
        <p className={styles.subtitle}>
          Enviamos um código de 6 dígitos para <strong className={styles.email}>{email}</strong>. Ele vale por{" "}
          {CIRCUIT_SIGNUP_CODE_TTL_MINUTES} minutos.
        </p>
      </header>

      {serverError && (
        <p key={serverError} className={styles.error} role="alert">
          <CircleAlert size={17} strokeWidth={2} aria-hidden />
          {serverError}
        </p>
      )}

      <div className={styles.codeSection}>
        <fieldset className={styles.fieldset} aria-describedby={localError ? fieldErrorId : undefined}>
          <legend className={styles.legend}>Código de confirmação de 6 dígitos</legend>

          <div className={styles.codeGrid}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Dígito ${index + 1} de ${CIRCUIT_SIGNUP_CODE_LENGTH}`}
                aria-invalid={hasCodeError || undefined}
                data-filled={digit !== "" || undefined}
                className={styles.codeBox}
                value={digit}
                disabled={isConfirming}
                onChange={(event) => handleChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={(event) => handlePaste(index, event)}
                onFocus={(event) => event.currentTarget.select()}
              />
            ))}
          </div>

          {localError && (
            <span id={fieldErrorId} className={styles.fieldError} role="alert">
              {localError}
            </span>
          )}
        </fieldset>

        <div className={styles.resendRow}>
          <span>Não recebeu?</span>
          <button
            type="button"
            className={styles.resendButton}
            onClick={() => void handleResend()}
            disabled={isBusy || isCoolingDown}
          >
            {showResendingLabel && "Reenviando código…"}
            {showCooldownLabel && `Reenviar código em ${formatResendCountdown(effectiveCooldown)}`}
            {showReadyResendLabel && "Reenviar código"}
          </button>
          {hasResent && (
            <span className={styles.resentNotice} role="status">
              Novo código enviado.
            </span>
          )}
        </div>
      </div>

      <button type="submit" className={styles.submit} disabled={isBusy}>
        {isConfirming && <Spinner className={styles.spinner} size="small" />}
        {isConfirming ? "Verificando…" : "Confirmar"}
      </button>
    </form>
  );
}
