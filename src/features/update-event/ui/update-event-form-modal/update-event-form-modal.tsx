"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_UPDATE_FIELDS,
  isEventFieldEditable,
  type Event,
  type EventUpdateField,
} from "@/entities/event";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { TextField } from "@/shared/ui/text-field";

import { updateEventSchema, type UpdateEventFormValues } from "../../model";

import styles from "./update-event-form-modal.module.css";

interface UpdateEventFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    event: Event,
    values: UpdateEventFormValues,
  ) => Promise<{ success: boolean; error?: string; data?: Event }>;
  event: Event | null;
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

function toFormValues(event: Event | null): UpdateEventFormValues {
  return {
    title: event?.title ?? "",
    ticketPrice: event?.ticketPrice ?? "",
    registrationDeadline: event ? toDateInputValue(event.registrationDeadline) : "",
    paymentDeadline: event ? toDateInputValue(event.paymentDeadline) : "",
    venue: event?.venue ?? "",
    address: event?.address ?? "",
    city: event?.city ?? "",
    state: event?.state ?? "",
    observations: event?.observations ?? "",
  };
}

export function UpdateEventFormModal({ open, onClose, onSubmit, event }: UpdateEventFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEventFormValues>({
    resolver: zodResolver(updateEventSchema),
    mode: "onChange",
    values: toFormValues(event),
  });

  function isEditable(field: EventUpdateField): boolean {
    if (!event) return false;
    if (event.status === EVENT_STATUSES.OPEN) return true;

    return isEventFieldEditable(event.status, field);
  }

  const shouldShowRestrictionMessage = event ? event.status === EVENT_STATUSES.CLOSED : false;

  async function handleFormSubmit(values: UpdateEventFormValues) {
    if (!event) return;

    setServerError(null);

    const result = await onSubmit(event, values);

    if (!result.success) {
      setServerError(result.error ?? "Não foi possível atualizar o evento.");
      return;
    }

    reset(toFormValues(result.data ?? event));
    onClose();
  }

  function handleClose() {
    setServerError(null);
    reset(toFormValues(event));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Editar Evento"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="update-event-form" disabled={isSubmitting || !event}>
            {isSubmitting ? "Salvando…" : "Salvar alterações"}
          </Button>
        </>
      }
    >
      <form id="update-event-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}

        {shouldShowRestrictionMessage && event && (
          <div className={styles.errorBanner} role="status">
            Campos disponíveis para o status {EVENT_STATUS_LABELS[event.status]}.
          </div>
        )}

        <section className={styles.section} aria-labelledby="update-event-info-title">
          <h3 id="update-event-info-title" className={styles.sectionTitle}>
            Informações do evento
          </h3>
          <div className={styles.grid}>
            <TextField
              className={styles.fullWidth}
              label="Título"
              placeholder="Ex: Assembleia SP 2026"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.TITLE)}
              error={errors.title?.message}
              {...register("title")}
            />
            <TextField
              label="Valor da passagem"
              inputMode="decimal"
              placeholder="25.00"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.TICKET_PRICE)}
              error={errors.ticketPrice?.message}
              {...register("ticketPrice")}
            />
            <TextField
              label="Prazo de inscrição"
              type="date"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.REGISTRATION_DEADLINE)}
              error={errors.registrationDeadline?.message}
              {...register("registrationDeadline")}
            />
            <TextField
              label="Prazo de pagamento"
              type="date"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.PAYMENT_DEADLINE)}
              error={errors.paymentDeadline?.message}
              {...register("paymentDeadline")}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="update-event-place-title">
          <h3 id="update-event-place-title" className={styles.sectionTitle}>
            Local
          </h3>
          <div className={styles.grid}>
            <TextField
              label="Nome do local"
              placeholder="Salão Central"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.VENUE)}
              error={errors.venue?.message}
              {...register("venue")}
            />
            <TextField
              label="Cidade"
              placeholder="São Paulo"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.CITY)}
              error={errors.city?.message}
              {...register("city")}
            />
            <TextField
              className={styles.fullWidth}
              label="Endereço"
              placeholder="Rua das Flores, 100"
              disabled={!isEditable(EVENT_UPDATE_FIELDS.ADDRESS)}
              error={errors.address?.message}
              {...register("address")}
            />
            <TextField
              label="Estado"
              placeholder="SP"
              maxLength={2}
              disabled={!isEditable(EVENT_UPDATE_FIELDS.STATE)}
              error={errors.state?.message}
              {...register("state")}
            />
          </div>
        </section>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="update-event-observations">
            Observações
          </label>
          <textarea
            id="update-event-observations"
            className={`${styles.textarea} ${errors.observations ? styles.hasError : ""}`.trim()}
            placeholder="Informações úteis para os coordenadores"
            disabled={!isEditable(EVENT_UPDATE_FIELDS.OBSERVATIONS)}
            {...register("observations")}
          />
          {errors.observations?.message && <span className={styles.errorMessage}>{errors.observations.message}</span>}
        </div>
      </form>
    </Modal>
  );
}
