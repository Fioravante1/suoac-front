"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { EventDayInEvent } from "@/entities/event";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { TextField } from "@/shared/ui/text-field";

import { updateEventDaySchema, type UpdateEventDayFormValues } from "../../model";

import styles from "./update-event-day-form-modal.module.css";

interface UpdateEventDayFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (day: EventDayInEvent, values: UpdateEventDayFormValues) => Promise<{ success: boolean; error?: string }>;
  day: EventDayInEvent | null;
}

function toFormValues(day: EventDayInEvent | null): UpdateEventDayFormValues {
  return {
    departureTime: day?.departureTime ?? "",
    returnTime: day?.returnTime ?? "",
  };
}

export function UpdateEventDayFormModal({ open, onClose, onSubmit, day }: UpdateEventDayFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEventDayFormValues>({
    resolver: zodResolver(updateEventDaySchema),
    mode: "onChange",
    values: toFormValues(day),
  });

  async function handleFormSubmit(values: UpdateEventDayFormValues) {
    if (!day) return;

    setServerError(null);

    const result = await onSubmit(day, values);

    if (!result.success) {
      setServerError(result.error ?? "Não foi possível atualizar os horários.");
      return;
    }

    reset();
    onClose();
  }

  function handleClose() {
    setServerError(null);
    reset(toFormValues(day));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Editar horários — ${day?.label ?? ""}`}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="update-event-day-form" disabled={isSubmitting || !day}>
            {isSubmitting ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="update-event-day-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}

        <div className={styles.grid}>
          <TextField
            label="Horário de saída"
            type="time"
            error={errors.departureTime?.message}
            {...register("departureTime")}
          />
          <TextField
            label="Horário de retorno"
            type="time"
            error={errors.returnTime?.message}
            {...register("returnTime")}
          />
        </div>
      </form>
    </Modal>
  );
}
