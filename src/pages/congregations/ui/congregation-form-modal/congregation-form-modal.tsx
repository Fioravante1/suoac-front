"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useServerError } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { Spinner } from "@/shared/ui/spinner";
import { TextField } from "@/shared/ui/text-field";

import type { Congregation } from "@/entities/congregation";

import { congregationFormSchema, type CongregationFormValues } from "../../model/congregation-form-schema";

import styles from "./congregation-form-modal.module.css";

interface CongregationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CongregationFormValues) => Promise<{ success: boolean; error?: string }>;
  congregation?: Congregation | null;
}

export function CongregationFormModal({ open, onClose, onSubmit, congregation }: CongregationFormModalProps) {
  const isEditing = Boolean(congregation);
  const { serverError, clearServerError, showServerError } = useServerError();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CongregationFormValues>({
    resolver: zodResolver(congregationFormSchema),
    values: congregation
      ? { code: congregation.code, name: congregation.name, email: congregation.email, city: congregation.city ?? "" }
      : { code: "", name: "", email: "", city: "" },
  });

  async function handleFormSubmit(values: CongregationFormValues) {
    clearServerError();

    const result = await onSubmit(values);

    if (!result.success) {
      showServerError(result.error);
      return;
    }

    reset();
    onClose();
  }

  function handleClose() {
    clearServerError();
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar Congregação" : "Nova Congregação"}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="congregation-form" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="small" />}
            {isSubmitting ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="congregation-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            {serverError}
          </div>
        )}
        <TextField label="Código" placeholder="Ex: 105478" error={errors.code?.message} {...register("code")} />
        <TextField label="Nome" placeholder="Nome da congregação" error={errors.name?.message} {...register("name")} />
        <TextField
          label="E-mail"
          type="email"
          placeholder="congregacao@exemplo.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField label="Cidade" placeholder="Nome da cidade" error={errors.city?.message} {...register("city")} />
      </form>
    </Modal>
  );
}
