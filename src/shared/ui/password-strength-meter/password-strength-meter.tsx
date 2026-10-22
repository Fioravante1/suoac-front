"use client";

import { Check } from "lucide-react";

import { PASSWORD_REQUIREMENTS, countMetRequirements } from "@/shared/lib";

import styles from "./password-strength-meter.module.css";

interface PasswordStrengthMeterProps {
  /** Valor atual do campo de senha. */
  value: string;
  /** Oculta a lista de requisitos, deixando so as barras. */
  barsOnly?: boolean;
  className?: string;
}

/*
 * So o ultimo nivel e aceito pela API — os anteriores sao graus de insuficiencia,
 * nao de qualidade. Por isso o penultimo e "quase la" e nao "boa", como traz o
 * handoff: senha de seis caracteres com maiuscula, minuscula e numero cumpre
 * tres dos quatro requisitos, e chamar isso de boa prometeria uma aprovacao que
 * o servidor vai negar. E a unica palavra em que esta tela se afasta do desenho.
 */
const LEVEL_LABELS = ["muito fraca", "fraca", "razoável", "quase lá", "forte"] as const;

/** Instrucao no lugar da nota enquanto o campo esta vazio — nao ha o que medir. */
const EMPTY_HINT = "Use letras maiúsculas, minúsculas e números";

/**
 * Forca da senha em barras, com a lista do que ainda falta.
 *
 * As barras contam **requisitos cumpridos**, nao entropia: sao exatamente as
 * regras que a API exige, e e o unico medidor que nao mente. Medidor baseado em
 * entropia aprovaria `senhalonga` com nota alta e o servidor devolveria `400`
 * — ver `shared/lib/password-policy`.
 *
 * A lista de pendencias existe porque barra colorida sozinha nao diz o que
 * fazer: quem ve "fraca" e nao sabe o motivo tenta acrescentar caracteres ao
 * acaso.
 */
export function PasswordStrengthMeter({ value, barsOnly = false, className }: PasswordStrengthMeterProps) {
  const met = countMetRequirements(value);
  const total = PASSWORD_REQUIREMENTS.length;
  const isEmpty = value.length === 0;

  return (
    <div className={[styles.meter, className].filter(Boolean).join(" ")}>
      <div className={styles.bars} aria-hidden>
        {PASSWORD_REQUIREMENTS.map((requirement, index) => (
          <span key={requirement.id} className={styles.bar}>
            <span
              className={[styles.barFill, !isEmpty && index < met && styles[`level${met}`]].filter(Boolean).join(" ")}
            />
          </span>
        ))}
      </div>

      {/* A nota e anunciada por regiao viva: quem usa leitor de tela precisa do
          retorno sem ter de sair do campo para procurar a barra. */}
      <p
        className={[styles.level, !isEmpty && styles[`levelText${met}`]].filter(Boolean).join(" ")}
        role="status"
        aria-live="polite"
      >
        {!isEmpty && (
          <>
            Senha <strong>{LEVEL_LABELS[met]}</strong>
          </>
        )}
        {isEmpty && <span className={styles.levelPlaceholder}>{EMPTY_HINT}</span>}
      </p>

      {!barsOnly && (
        <ul className={styles.requirements} aria-label="Requisitos da senha">
          {PASSWORD_REQUIREMENTS.map((requirement) => {
            const satisfied = requirement.test(value);

            return (
              <li
                key={requirement.id}
                className={[styles.requirement, satisfied && styles.satisfied].filter(Boolean).join(" ")}
              >
                <span className={styles.requirementIcon} aria-hidden>
                  {satisfied && <Check size={10} strokeWidth={4} />}
                </span>
                <span>
                  {requirement.label}
                  <span className={styles.srOnly}>{satisfied ? " — cumprido" : " — pendente"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <span className={styles.srOnly}>
        {met} de {total} requisitos cumpridos.
      </span>
    </div>
  );
}
