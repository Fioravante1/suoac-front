"use client";

import { Hash, MapPin } from "lucide-react";
import { useFormContext } from "react-hook-form";

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
 * O chip do privilégio fixo entra no SUC-30, junto do acabamento.
 */
export function SignupStepCircuit() {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<SignupFormValues>();

  return (
    <>
      <TextFieldNext
        label="Circuito"
        placeholder="Ex.: SP-17"
        icon={<Hash size={18} strokeWidth={1.8} />}
        maxLength={20}
        error={errors.circuit?.name?.message}
        disabled={isSubmitting}
        {...register("circuit.name")}
      />

      <div className={styles.location}>
        <TextFieldNext
          label="Cidade"
          placeholder="Ex.: Campinas"
          icon={<MapPin size={18} strokeWidth={1.8} />}
          error={errors.circuit?.city?.message}
          disabled={isSubmitting}
          {...register("circuit.city")}
        />
        <TextFieldNext
          label="UF"
          placeholder="SP"
          maxLength={2}
          error={errors.circuit?.state?.message}
          disabled={isSubmitting}
          {...register("circuit.state")}
        />
      </div>

      <div className={styles.terms}>
        <Checkbox
          label="Li e aceito os termos de uso e a política de privacidade do SUOAC"
          disabled={isSubmitting}
          {...register("acceptedTerms")}
        />
        {errors.acceptedTerms?.message && (
          <p className={styles.termsError} role="alert">
            {errors.acceptedTerms.message}
          </p>
        )}
      </div>
    </>
  );
}
