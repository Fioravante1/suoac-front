"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";

import type { Event } from "@/entities/event";
import { congregationSelectOptions } from "@/entities/congregation";
import { useQuery } from "@/shared/api";
import { isCircuitRole, redirectToSessionExpired, type UserRole } from "@/shared/auth";
import { downloadResponseAsFile, useModal } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { Spinner } from "@/shared/ui/spinner";
import { useToast } from "@/shared/ui/toast";

import { buildExportPath, type ExportOptions } from "../../model/export-options";
import { exportFormDefaultValues, exportFormSchema, type ExportFormValues } from "../../model/export-form";
import styles from "./export-passengers-button.module.css";

interface ExportPassengersButtonProps {
  event: Event;
  userRole: UserRole;
}

function messageForStatus(status: number, backendMessage?: string): string {
  if (status === 403) return "Você não tem permissão para esta exportação.";
  if (status === 404) return "Evento ou congregação não encontrado.";
  if (status === 422) return backendMessage ?? "Há muitos inscritos. Exporte por congregação.";
  return backendMessage ?? "Não foi possível exportar o PDF. Tente novamente.";
}

export function ExportPassengersButton({ event, userRole }: ExportPassengersButtonProps) {
  const toast = useToast();
  const optionsModal = useModal();
  const isCircuit = isCircuitRole(userRole);
  const [isExporting, setIsExporting] = useState(false);

  const congregationsQuery = useQuery({
    ...congregationSelectOptions(event.circuitId),
    enabled: isCircuit && optionsModal.isOpen,
  });

  const { register, handleSubmit, reset } = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: exportFormDefaultValues,
  });

  async function performExport(options: ExportOptions): Promise<void> {
    setIsExporting(true);

    try {
      const response = await fetch(buildExportPath(event.id, options), { credentials: "same-origin" });

      if (response.ok) {
        await downloadResponseAsFile(response, `inscritos-${event.id}.pdf`);
        toast.success("Exportação concluída.");
        optionsModal.close();
        return;
      }

      if (response.status === 401) {
        redirectToSessionExpired();
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { message?: string };
      toast.error(messageForStatus(response.status, body.message));
    } catch {
      toast.error("Não foi possível exportar o PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleOpen(): void {
    reset(exportFormDefaultValues);
    optionsModal.open();
  }

  function onSubmit(values: ExportFormValues): Promise<void> {
    return performExport({
      congregationId: values.congregationId || undefined,
      includeSensitive: values.includeSensitive,
    });
  }

  if (!isCircuit) {
    return (
      <Button size="small" variant="secondary" onClick={() => performExport({})} disabled={isExporting}>
        {isExporting ? <Spinner size="small" /> : <Download size={16} aria-hidden="true" />}
        {isExporting ? "Exportando..." : "Exportar PDF"}
      </Button>
    );
  }

  return (
    <>
      <Button size="small" variant="secondary" onClick={handleOpen}>
        <Download size={16} aria-hidden="true" />
        Exportar PDF
      </Button>

      <Modal
        open={optionsModal.isOpen}
        onClose={optionsModal.close}
        title="Exportar PDF"
        footer={
          <>
            <Button variant="ghost" onClick={optionsModal.close} disabled={isExporting}>
              Cancelar
            </Button>
            <Button type="submit" form="export-passengers-form" disabled={isExporting}>
              {isExporting && <Spinner size="small" />}
              {isExporting ? "Exportando..." : "Exportar"}
            </Button>
          </>
        }
      >
        <form id="export-passengers-form" className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <label className={styles.field}>
            <span className={styles.label}>Congregação</span>
            <select className={styles.select} disabled={congregationsQuery.isLoading} {...register("congregationId")}>
              <option value="">Todas as congregações</option>
              {congregationsQuery.data?.data.map((congregation) => (
                <option key={congregation.id} value={congregation.id}>
                  {congregation.name}
                </option>
              ))}
            </select>
            {congregationsQuery.isError && (
              <span className={styles.hint}>
                Não foi possível carregar as congregações. Você ainda pode exportar todas.
              </span>
            )}
          </label>

          <label className={styles.checkboxField}>
            <input type="checkbox" {...register("includeSensitive")} />
            <span>Incluir RG no PDF</span>
          </label>
        </form>
      </Modal>
    </>
  );
}
