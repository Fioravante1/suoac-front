"use client";

import { type ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { EVENT_TYPE_LABELS, EVENT_TYPES } from "@/entities/event";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { TextField } from "@/shared/ui/text-field";

import { createEventDefaultValues, createEventSchema, type CreateEventFormValues } from "../../model";

import styles from "./create-event-form-modal.module.css";

interface CreateEventFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateEventFormValues) => Promise<{ success: boolean; error?: string }>;
}

export function CreateEventFormModal({ open, onClose, onSubmit }: CreateEventFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    mode: "onChange",
    defaultValues: createEventDefaultValues,
  });

  const [eventType, setEventType] = useState<CreateEventFormValues["type"]>(createEventDefaultValues.type);
  const eventTypeField = register("type", {
    onChange: (event: ChangeEvent<HTMLSelectElement>) => {
      setEventType(event.target.value as CreateEventFormValues["type"]);
    },
  });

  async function handleFormSubmit(values: CreateEventFormValues) {
    setServerError(null);

    const result = await onSubmit(values);

    if (!result.success) {
      setServerError(result.error ?? "Não foi possível criar o evento.");
      return;
    }

    reset(createEventDefaultValues);
    setEventType(createEventDefaultValues.type);
    onClose();
  }

  function handleClose() {
    setServerError(null);
    reset(createEventDefaultValues);
    setEventType(createEventDefaultValues.type);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Evento"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="create-event-form" disabled={isSubmitting}>
            {isSubmitting ? "Criando…" : "Criar evento"}
          </Button>
        </>
      }
    >
      <form id="create-event-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}

        <section className={styles.section} aria-labelledby="event-info-title">
          <h3 id="event-info-title" className={styles.sectionTitle}>
            Informações do evento
          </h3>
          <div className={styles.grid}>
            <TextField
              className={styles.fullWidth}
              label="Título"
              placeholder="Ex: Assembleia SP 2026"
              error={errors.title?.message}
              {...register("title")}
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-type">
                Tipo
              </label>
              <select
                id="event-type"
                className={`${styles.select} ${errors.type ? styles.hasError : ""}`.trim()}
                {...eventTypeField}
              >
                <option value={EVENT_TYPES.ASSEMBLY}>{EVENT_TYPE_LABELS[EVENT_TYPES.ASSEMBLY]}</option>
                <option value={EVENT_TYPES.REGIONAL_CONVENTION}>
                  {EVENT_TYPE_LABELS[EVENT_TYPES.REGIONAL_CONVENTION]}
                </option>
              </select>
              {errors.type?.message && <span className={styles.errorMessage}>{errors.type.message}</span>}
            </div>

            <TextField
              label="Valor da passagem"
              inputMode="decimal"
              placeholder="25.00"
              error={errors.ticketPrice?.message}
              {...register("ticketPrice")}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="event-place-title">
          <h3 id="event-place-title" className={styles.sectionTitle}>
            Local
          </h3>
          <div className={styles.grid}>
            <TextField
              label="Nome do local"
              placeholder="Salão Central"
              error={errors.venue?.message}
              {...register("venue")}
            />
            <TextField label="Cidade" placeholder="São Paulo" error={errors.city?.message} {...register("city")} />
            <TextField
              className={styles.fullWidth}
              label="Endereço"
              placeholder="Rua das Flores, 100"
              error={errors.address?.message}
              {...register("address")}
            />
            <TextField
              label="Estado"
              placeholder="SP"
              maxLength={2}
              error={errors.state?.message}
              {...register("state")}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="event-dates-title">
          <h3 id="event-dates-title" className={styles.sectionTitle}>
            Datas e horários
          </h3>
          <div className={styles.grid}>
            <TextField
              label={eventType === EVENT_TYPES.REGIONAL_CONVENTION ? "Data inicial do evento" : "Data do evento"}
              type="date"
              error={errors.date?.message}
              {...register("date")}
            />
            {eventType === EVENT_TYPES.REGIONAL_CONVENTION && (
              <TextField
                label="Data final do evento"
                type="date"
                error={errors.endDate?.message}
                {...register("endDate")}
              />
            )}
            <TextField
              label="Prazo de inscrição"
              type="date"
              error={errors.registrationDeadline?.message}
              {...register("registrationDeadline")}
            />
            <TextField
              label="Prazo de pagamento"
              type="date"
              error={errors.paymentDeadline?.message}
              {...register("paymentDeadline")}
            />
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
        </section>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="event-observations">
            Observações
          </label>
          <textarea
            id="event-observations"
            className={`${styles.textarea} ${errors.observations ? styles.hasError : ""}`.trim()}
            placeholder="Informações úteis para os coordenadores"
            {...register("observations")}
          />
          {errors.observations?.message && <span className={styles.errorMessage}>{errors.observations.message}</span>}
        </div>
      </form>
    </Modal>
  );
}
