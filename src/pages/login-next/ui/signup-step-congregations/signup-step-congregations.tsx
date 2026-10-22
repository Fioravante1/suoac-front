"use client";

import { Plus, UserRound, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { TextFieldNext } from "@/shared/ui/text-field-next";

import type { SignupFormValues } from "../../model";

import styles from "./signup-step-congregations.module.css";

/**
 * Teto de linhas na tela. Não é regra do domínio: é o que impede a lista de
 * crescer sem fim por um clique repetido. Um circuito passa de vinte
 * congregações só em casos raros, e o restante entra pelo painel depois.
 */
const MAX_CONGREGATIONS = 25;

/**
 * Etapa 3 do autocadastro: as congregações do circuito.
 *
 * A **primeira** linha é a congregação do próprio coordenador — é ela que
 * recebe o `congregationId` do usuário criado, por isso nome e código são
 * obrigatórios e a linha não pode ser removida. As demais são opcionais e
 * se adicionam e removem; a regra "nome preenchido exige código" mora no
 * schema, linha a linha, para o erro cair na linha incompleta.
 *
 * A `key` de cada linha é o `id` que o `useFieldArray` gera, e não o índice:
 * com o índice, remover uma linha do meio faria o React reaproveitar os
 * campos e embaralhar os valores das que sobram.
 *
 * O e-mail da congregação não é pedido de propósito: o coordenador do circuito
 * não tem como saber o endereço de cada uma no momento do cadastro.
 */
export function SignupStepCongregations() {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<SignupFormValues>();

  const { fields, append, remove } = useFieldArray({ control, name: "congregations" });

  const ownCongregationErrors = errors.congregations?.[0];
  const extraFields = fields.slice(1);
  const canAdd = fields.length < MAX_CONGREGATIONS;

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

      {extraFields.length > 0 && <p className={styles.othersLabel}>Outras congregações · opcional</p>}

      {/* Lista rolável: com muitas linhas ela não empurra o botão para fora da tela. */}
      <ul className={styles.list}>
        {extraFields.map((field, offset) => {
          // `fields` começa na linha própria, então a linha adicional N é N + 1.
          const index = offset + 1;
          const rowErrors = errors.congregations?.[index];

          return (
            <li key={field.id} className={styles.extraRow}>
              <div className={styles.row}>
                <TextFieldNext
                  label={`Congregação ${index + 1}`}
                  placeholder="Nome da congregação"
                  error={rowErrors?.name?.message}
                  disabled={isSubmitting}
                  {...register(`congregations.${index}.name`)}
                />
                <TextFieldNext
                  label={`Código da congregação ${index + 1}`}
                  placeholder="Código"
                  maxLength={20}
                  error={rowErrors?.code?.message}
                  disabled={isSubmitting}
                  {...register(`congregations.${index}.code`)}
                />
              </div>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(index)}
                disabled={isSubmitting}
                aria-label={`Remover congregação ${index + 1}`}
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className={styles.add}
        onClick={() => append({ name: "", code: "" })}
        disabled={isSubmitting || !canAdd}
      >
        <Plus size={16} strokeWidth={2} aria-hidden />
        Adicionar congregação
      </button>

      <p className={styles.note}>
        Você pode completar a lista e convidar os coordenadores das congregações depois, pelo painel.
      </p>
    </>
  );
}
