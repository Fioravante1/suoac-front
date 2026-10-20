"use client";

import { UserRound } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { TextFieldNext } from "@/shared/ui/text-field-next";

import type { SignupFormValues } from "../../model";

import styles from "./signup-step-congregations.module.css";

/**
 * Etapa 3 do autocadastro: as congregações do circuito.
 *
 * Aqui só a **primeira** linha, que é a congregação do próprio coordenador — é
 * ela que recebe o `congregationId` do usuário criado, e por isso nome e código
 * são obrigatórios. Adicionar e remover as demais linhas, com a lista rolável,
 * entra no SUC-31.
 *
 * O e-mail da congregação não é pedido de propósito: o coordenador do circuito
 * não tem como saber o endereço de cada uma no momento do cadastro.
 */
export function SignupStepCongregations() {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<SignupFormValues>();

  const ownCongregationErrors = errors.congregations?.[0];

  return (
    <>
      <p className={styles.ownLabel}>
        <UserRound size={13} strokeWidth={2.2} aria-hidden />
        Sua congregação · obrigatória
      </p>

      <div className={styles.row}>
        <TextFieldNext
          label="Congregação"
          placeholder="Nome da sua congregação"
          error={ownCongregationErrors?.name?.message}
          disabled={isSubmitting}
          {...register("congregations.0.name")}
        />
        <TextFieldNext
          label="Código"
          placeholder="Código"
          /* O schema recusa acima de 20; barrar aqui evita digitar para nada. */
          maxLength={20}
          error={ownCongregationErrors?.code?.message}
          disabled={isSubmitting}
          {...register("congregations.0.code")}
        />
      </div>

      <p className={styles.note}>
        Você pode completar a lista e convidar os coordenadores das congregações depois, pelo painel.
      </p>
    </>
  );
}
