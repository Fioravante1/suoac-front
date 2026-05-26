"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { passengerFormSchema, type Passenger, type PassengerFormValues } from "@/entities/passenger";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { TextField } from "@/shared/ui/text-field";

import styles from "./passenger-form-modal.module.css";

interface PassengerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PassengerFormValues) => Promise<{ success: boolean; error?: string }>;
  passenger?: Passenger | null;
}

export function PassengerFormModal({ open, onClose, onSubmit, passenger }: PassengerFormModalProps) {
  const isEditing = Boolean(passenger);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerFormSchema),
    mode: "onChange",
    values: passenger
      ? {
          name: passenger.name,
          rg: passenger.rg,
          phone: passenger.phone ?? "",
          observations: passenger.observations ?? "",
        }
      : { name: "", rg: "", phone: "", observations: "" },
  });

  async function handleFormSubmit(values: PassengerFormValues) {
    setServerError(null);

    const result = await onSubmit(values);

    if (!result.success) {
      setServerError(result.error ?? "Ocorreu um erro inesperado.");
    }
  }

  function handleClose() {
    setServerError(null);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar passageiro" : "Novo passageiro"}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="passenger-form" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="passenger-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}
        <TextField
          label="Nome completo"
          placeholder="Ex: João Silva"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField label="RG" placeholder="Ex: 12.345.678-X" error={errors.rg?.message} {...register("rg")} />
        <TextField
          label="Telefone"
          placeholder="Ex: 11999999999"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <div className={styles.textareaGroup}>
          <label htmlFor="passenger-observations" className={styles.label}>
            Observações
          </label>
          <textarea
            id="passenger-observations"
            className={`${styles.textarea} ${errors.observations ? styles.textareaError : ""}`.trim()}
            placeholder="Ex: Necessita de assento especial"
            rows={4}
            {...register("observations")}
          />
          {errors.observations && <span className={styles.errorMessage}>{errors.observations.message}</span>}
        </div>
      </form>
    </Modal>
  );
}
