"use client";

import Link from "next/link";
import { MapPin, Route, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { routes } from "@/shared/config";
import { uppercaseInput } from "@/shared/lib";
import { Checkbox } from "@/shared/ui/checkbox";
import { TextFieldNext } from "@/shared/ui/text-field-next";

import type { SignupFormValues } from "../../model";

import styles from "./signup-step-circuit.module.css";

/**
 * Etapa 2 do autocadastro: o circuito que está nascendo.
 *
 * O identificador que a pessoa conhece como circuito (`SP-17`) ocupa `name` no
 * domínio. Não há código e nome descritivo separados.
 *
 * A unicidade só é conferida no envio final, na etapa 3.
 */
export function SignupStepCircuit() {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<SignupFormValues>();
  const termsErrorId = useId();
  const privilegeId = useId();
  const circuitField = register("circuit.name");
  const stateField = register("circuit.state");

  return (
    <>
      <TextFieldNext
        label="Circuito"
        placeholder="Ex.: SP-17"
        icon={<Route size={18} strokeWidth={1.8} />}
        maxLength={20}
        error={errors.circuit?.name?.message}
        disabled={isSubmitting}
        autoCapitalize="characters"
        spellCheck={false}
        {...circuitField}
        onChange={(event) => {
          uppercaseInput(event.currentTarget);
          return circuitField.onChange(event);
        }}
      />

      <div className={styles.location}>
        <TextFieldNext
          label="Cidade"
          placeholder="Ex.: Campinas"
          autoComplete="address-level2"
          maxLength={100}
          icon={<MapPin size={18} strokeWidth={1.8} />}
          error={errors.circuit?.city?.message}
          disabled={isSubmitting}
          {...register("circuit.city")}
        />
        <TextFieldNext
          label="UF"
          placeholder="SP"
          maxLength={2}
          autoComplete="address-level1"
          autoCapitalize="characters"
          spellCheck={false}
          error={errors.circuit?.state?.message}
          disabled={isSubmitting}
          {...stateField}
          onChange={(event) => {
            uppercaseInput(event.currentTarget);
            return stateField.onChange(event);
          }}
        />
      </div>

      <div className={styles.privilege} role="group" aria-labelledby={privilegeId}>
        <span id={privilegeId} className={styles.label}>
          Seu privilégio
        </span>
        <p className={styles.privilegeValue}>
          <ShieldCheck size={16} strokeWidth={2} aria-hidden />
          Coordenador do arranjo de ônibus no circuito
        </p>
      </div>

      <div className={styles.terms}>
        <Checkbox
          label="Li e aceito os termos de uso e a política de privacidade do SUOAC"
          disabled={isSubmitting}
          aria-invalid={errors.acceptedTerms ? true : undefined}
          aria-describedby={errors.acceptedTerms ? termsErrorId : undefined}
          {...register("acceptedTerms")}
        />
        {errors.acceptedTerms?.message && (
          <p id={termsErrorId} className={styles.termsError} role="alert">
            {errors.acceptedTerms.message}
          </p>
        )}
        <p className={styles.termsLinks}>
          Consulte os{" "}
          <Link prefetch={false} href={routes.terms} target="_blank" rel="noopener noreferrer">
            termos de uso
          </Link>
          {" e a "}
          <Link prefetch={false} href={routes.privacy} target="_blank" rel="noopener noreferrer">
            política de privacidade
          </Link>
          .
        </p>
      </div>
    </>
  );
}
