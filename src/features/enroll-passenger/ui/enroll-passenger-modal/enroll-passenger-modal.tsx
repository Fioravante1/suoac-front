"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, UserPlus } from "lucide-react";

import type { EventPassenger } from "@/entities/event-passenger";
import type { Event, EventDayInEvent } from "@/entities/event";
import { EVENT_DAY_STATUSES, EVENT_TYPES } from "@/entities/event";
import type { Passenger } from "@/entities/passenger";
import { useQuery } from "@/shared/api";
import type { ActionResult } from "@/shared/api";
import { useServerError } from "@/shared/lib";
import { passengerListOptions } from "@/entities/passenger";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { Spinner } from "@/shared/ui/spinner";
import { TextField } from "@/shared/ui/text-field";
import { Pagination } from "@/shared/ui/pagination";

import {
  enrollPassengerSchema,
  toEnrollPayload,
  type EnrollPassengerFormValues,
  type EnrollPassengerPayload,
  usePassengerSearch,
} from "../../model";

import styles from "./enroll-passenger-modal.module.css";

interface EnrollPassengerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: EnrollPassengerPayload) => Promise<ActionResult<EventPassenger>>;
  event: Event;
  congregationId: string;
}

function getActiveDays(event: Event): EventDayInEvent[] {
  return (event.days ?? []).filter((day) => day.status === EVENT_DAY_STATUSES.ACTIVE);
}

const DEFAULT_VALUES: EnrollPassengerFormValues = {
  mode: "existing",
  passengerId: "",
  name: "",
  rg: "",
  phone: "",
  dayIds: [],
  observations: "",
  isExempt: false,
  exemptionReason: "",
};

export function EnrollPassengerModal({ open, onClose, onSubmit, event, congregationId }: EnrollPassengerModalProps) {
  const { searchTerm, searchPage, hasSearch, setSearchPage, updateSearchTerm, resetSearch } = usePassengerSearch();
  const { serverError, clearServerError, showServerError } = useServerError();

  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);

  const activeDays = getActiveDays(event);
  const isRegionalConvention = event.type === EVENT_TYPES.REGIONAL_CONVENTION;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollPassengerFormValues>({
    resolver: zodResolver(enrollPassengerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const activeTab = useWatch({ control, name: "mode" }) ?? DEFAULT_VALUES.mode;
  const isExempt = useWatch({ control, name: "isExempt" });
  const watchedDayIds = useWatch({ control, name: "dayIds" }) ?? [];

  const { data: passengersData, isLoading: isLoadingPassengers } = useQuery({
    ...passengerListOptions(congregationId, searchPage, searchTerm),
    enabled: hasSearch && Boolean(congregationId),
  });

  function handleTabChange(tab: EnrollPassengerFormValues["mode"]) {
    setSelectedPassenger(null);
    clearServerError();
    setValue("mode", tab);

    if (tab === "existing") {
      setValue("passengerId", "");
      setValue("name", "");
      setValue("rg", "");
      setValue("phone", "");
    } else {
      setValue("passengerId", "");
    }
  }

  function handleSelectPassenger(passenger: Passenger) {
    setSelectedPassenger(passenger);
    setValue("passengerId", passenger.id, { shouldValidate: true });
  }

  function handleDayToggle(dayId: string) {
    const current = watchedDayIds;
    const next = current.includes(dayId) ? current.filter((id) => id !== dayId) : [...current, dayId];

    setValue("dayIds", next, { shouldValidate: true });
  }

  async function handleFormSubmit(values: EnrollPassengerFormValues) {
    clearServerError();
    const payload = toEnrollPayload(values);
    const result = await onSubmit(payload);

    if (!result.success) {
      showServerError(result.error);
      return;
    }

    handleClose();
  }

  function handleClose() {
    clearServerError();
    setSelectedPassenger(null);
    resetSearch();
    reset(DEFAULT_VALUES);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Inscrever passageiro"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="enroll-passenger-form" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="small" /> : <UserPlus size={18} aria-hidden="true" />}
            {isSubmitting ? "Inscrevendo..." : "Inscrever"}
          </Button>
        </>
      }
    >
      <form id="enroll-passenger-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "existing" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("existing")}
          >
            Passageiro existente
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "inline" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("inline")}
          >
            Novo passageiro
          </button>
        </div>

        {activeTab === "existing" && (
          <div className={styles.section}>
            <TextField
              label="Buscar passageiro"
              placeholder="Nome ou RG"
              startIcon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => {
                updateSearchTerm(e.target.value);
              }}
            />

            {selectedPassenger && (
              <div className={styles.selectedPassenger}>
                <span className={styles.selectedLabel}>Selecionado:</span>
                <strong>{selectedPassenger.name}</strong>
                <span className={styles.selectedRg}>RG: {selectedPassenger.rg}</span>
              </div>
            )}

            {!hasSearch && !selectedPassenger && (
              <p className={styles.searchHint}>Digite ao menos 2 caracteres para buscar passageiros.</p>
            )}

            {hasSearch && (
              <div className={styles.passengerList}>
                {isLoadingPassengers && (
                  <div className={styles.loadingContainer}>
                    <Spinner size="small" />
                  </div>
                )}
                {passengersData?.data.map((passenger) => (
                  <button
                    key={passenger.id}
                    type="button"
                    className={`${styles.passengerItem} ${selectedPassenger?.id === passenger.id ? styles.passengerItemSelected : ""}`}
                    onClick={() => handleSelectPassenger(passenger)}
                  >
                    <span className={styles.passengerName}>{passenger.name}</span>
                    <span className={styles.passengerRg}>RG: {passenger.rg}</span>
                  </button>
                ))}
                {passengersData && passengersData.data.length === 0 && !isLoadingPassengers && (
                  <p className={styles.emptyList}>Nenhum passageiro encontrado.</p>
                )}
              </div>
            )}

            {hasSearch && passengersData && passengersData.meta.totalPages > 1 && (
              <Pagination page={searchPage} totalPages={passengersData.meta.totalPages} onPageChange={setSearchPage} />
            )}

            {errors.passengerId && <span className={styles.errorMessage}>{errors.passengerId.message}</span>}
          </div>
        )}

        {activeTab === "inline" && (
          <div className={styles.section}>
            <TextField
              label="Nome completo"
              placeholder="Ex: João da Silva"
              error={errors.name?.message}
              {...register("name")}
            />
            <TextField label="RG" placeholder="Ex: 12.345.678-X" error={errors.rg?.message} {...register("rg")} />
            <TextField
              label="Telefone (opcional)"
              placeholder="Ex: 11999999999"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
        )}

        {isRegionalConvention && activeDays.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Dias do evento</span>
            <div className={styles.daysGrid}>
              {activeDays.map((day) => (
                <label key={day.id} className={styles.dayCheckbox}>
                  <input
                    type="checkbox"
                    checked={watchedDayIds.includes(day.id)}
                    onChange={() => handleDayToggle(day.id)}
                  />
                  <span>{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="enroll-observations">
              Observações (opcional)
            </label>
            <textarea
              id="enroll-observations"
              className={`${styles.textarea} ${errors.observations ? styles.hasError : ""}`.trim()}
              placeholder="Informações adicionais sobre a inscrição"
              {...register("observations")}
            />
            {errors.observations?.message && <span className={styles.errorMessage}>{errors.observations.message}</span>}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.exemptCheckbox}>
            <input type="checkbox" {...register("isExempt")} />
            <span>Isento de pagamento</span>
          </label>

          {isExempt && (
            <TextField
              label="Motivo da isenção"
              placeholder="Ex: Pioneiro regular"
              error={errors.exemptionReason?.message}
              {...register("exemptionReason")}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
