"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { EventPassenger } from "@/entities/event-passenger";
import type { EventDayInEvent } from "@/entities/event";
import { EVENT_DAY_STATUSES } from "@/entities/event";
import type { ActionResult } from "@/shared/api";
import { useServerError } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { Spinner } from "@/shared/ui/spinner";

import { updateEventPassengerDaysSchema, type UpdateEventPassengerDaysFormValues } from "../../model";

import styles from "./update-days-modal.module.css";

interface UpdateDaysModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dayIds: string[]) => Promise<ActionResult<EventPassenger>>;
  eventDays: EventDayInEvent[];
  selectedDayIds: string[];
}

export function UpdateDaysModal({ open, onClose, onSubmit, eventDays, selectedDayIds }: UpdateDaysModalProps) {
  const { serverError, clearServerError, showServerError } = useServerError();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEventPassengerDaysFormValues>({
    resolver: zodResolver(updateEventPassengerDaysSchema),
    mode: "onChange",
    defaultValues: { dayIds: selectedDayIds },
  });
  const checkedDays = useWatch({ control, name: "dayIds" }) ?? [];

  const activeDays = eventDays.filter((day) => day.status === EVENT_DAY_STATUSES.ACTIVE);

  function handleToggle(dayId: string) {
    const next = checkedDays.includes(dayId) ? checkedDays.filter((id) => id !== dayId) : [...checkedDays, dayId];

    setValue("dayIds", next, { shouldValidate: true });
  }

  async function handleFormSubmit(values: UpdateEventPassengerDaysFormValues) {
    clearServerError();

    const result = await onSubmit(values.dayIds);

    if (!result.success) {
      showServerError(result.error);
      return;
    }

    handleClose();
  }

  function handleClose() {
    clearServerError();
    reset({ dayIds: selectedDayIds });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Editar dias da inscrição"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="update-days-form" disabled={isSubmitting || checkedDays.length === 0}>
            {isSubmitting && <Spinner size="small" />}
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="update-days-form" className={styles.content} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}

        <p className={styles.description}>Selecione os dias em que o passageiro participará:</p>

        <div className={styles.daysGrid}>
          {activeDays.map((day) => (
            <label key={day.id} className={styles.dayCheckbox}>
              <input type="checkbox" checked={checkedDays.includes(day.id)} onChange={() => handleToggle(day.id)} />
              <span>{day.label}</span>
            </label>
          ))}
        </div>

        {errors.dayIds?.message && (
          <div className={styles.errorBanner} role="alert">
            {errors.dayIds.message}
          </div>
        )}

        {activeDays.length === 0 && <p className={styles.emptyMessage}>Nenhum dia ativo disponível.</p>}
      </form>
    </Modal>
  );
}
