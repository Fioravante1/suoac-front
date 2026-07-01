"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { EXPORT_FORMATS, EXPORT_FORMAT_LABELS, type ExportFormat } from "../../model/export-format";
import {
  EXPORT_VARIANTS,
  EXPORT_VARIANT_DESCRIPTIONS,
  EXPORT_VARIANT_LABELS,
  type ExportVariant,
} from "../../model/export-variant";
import { exportFormDefaultValues, exportFormSchema, type ExportFormValues } from "../../model/export-form";
import styles from "./export-passengers-button.module.css";

interface ExportPassengersButtonProps {
  event: Event;
  userRole: UserRole;
}

const FORMAT_OPTIONS: ExportFormat[] = [EXPORT_FORMATS.PDF, EXPORT_FORMATS.XLSX];

function messageForStatus(status: number, backendMessage?: string): string {
  if (status === 400) return "Opção de exportação inválida.";
  if (status === 403) return "Você não tem permissão para esta exportação.";
  if (status === 404) return "Evento ou congregação não encontrado.";
  if (status === 422) return backendMessage ?? "Há muitos inscritos. Exporte por congregação.";
  return backendMessage ?? "Não foi possível exportar o arquivo. Tente novamente.";
}

export function ExportPassengersButton({ event, userRole }: ExportPassengersButtonProps) {
  const toast = useToast();
  const optionsModal = useModal();
  const isCircuit = isCircuitRole(userRole);
  // Chave do botão em exportação (variante no modal; boarding no fluxo direto de congregação).
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const congregationsQuery = useQuery({
    ...congregationSelectOptions(event.circuitId),
    enabled: isCircuit && optionsModal.isOpen,
  });

  const { register, handleSubmit, reset, control, setValue } = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: exportFormDefaultValues,
  });

  const selectedFormat = useWatch({ control, name: "format" });

  async function performExport(key: string, options: ExportOptions & { variant: ExportVariant }): Promise<void> {
    setExportingKey(key);

    try {
      const response = await fetch(buildExportPath(event.id, options), { credentials: "same-origin" });

      if (response.ok) {
        const format = options.format ?? EXPORT_FORMATS.PDF;
        await downloadResponseAsFile(response, `inscritos-${event.id}.${format}`);
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
      toast.error("Não foi possível exportar o arquivo. Tente novamente.");
    } finally {
      setExportingKey(null);
    }
  }

  function handleOpen(): void {
    reset(exportFormDefaultValues);
    optionsModal.open();
  }

  /** Roda a validação do formulário (congregação + formato) e dispara a exportação da variante escolhida. */
  function submitWithVariant(variant: ExportVariant): () => void {
    return handleSubmit((values: ExportFormValues) =>
      performExport(variant, {
        congregationId: values.congregationId || undefined,
        variant,
        format: values.format,
      }),
    );
  }

  // Papel de congregação: só a lista de embarque em PDF (sem RG), exportando direto como antes.
  if (!isCircuit) {
    const isExporting = exportingKey !== null;

    return (
      <Button
        size="small"
        variant="secondary"
        onClick={() => performExport(EXPORT_VARIANTS.BOARDING, { variant: EXPORT_VARIANTS.BOARDING })}
        disabled={isExporting}
      >
        {isExporting ? <Spinner size="small" /> : <Download size={16} aria-hidden="true" />}
        {isExporting ? "Exportando..." : "Lista de embarque"}
      </Button>
    );
  }

  const isExporting = exportingKey !== null;

  return (
    <>
      <Button size="small" variant="secondary" onClick={handleOpen}>
        <Download size={16} aria-hidden="true" />
        Exportar
      </Button>

      <Modal
        open={optionsModal.isOpen}
        onClose={optionsModal.close}
        title="Exportar inscritos"
        footer={
          <Button variant="ghost" onClick={optionsModal.close} disabled={isExporting}>
            Fechar
          </Button>
        }
      >
        <form id="export-passengers-form" className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.field}>
            <span className={styles.label}>Formato</span>
            <div className={styles.formatGroup} role="group" aria-label="Formato do arquivo">
              {FORMAT_OPTIONS.map((format) => {
                const isActive = selectedFormat === format;

                return (
                  <button
                    key={format}
                    type="button"
                    className={`${styles.formatButton} ${isActive ? styles.formatButtonActive : ""}`}
                    onClick={() => setValue("format", format)}
                    aria-pressed={isActive}
                    disabled={isExporting}
                  >
                    {EXPORT_FORMAT_LABELS[format]}
                  </button>
                );
              })}
            </div>
          </div>

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

          <div className={styles.variants}>
            {([EXPORT_VARIANTS.CARRIER, EXPORT_VARIANTS.BOARDING] as const).map((variant) => (
              <button
                key={variant}
                type="button"
                className={styles.variantButton}
                onClick={submitWithVariant(variant)}
                disabled={isExporting}
              >
                <span className={styles.variantHeader}>
                  {exportingKey === variant ? <Spinner size="small" /> : <Download size={16} aria-hidden="true" />}
                  <span className={styles.variantLabel}>{EXPORT_VARIANT_LABELS[variant]}</span>
                </span>
                <span className={styles.variantDescription}>{EXPORT_VARIANT_DESCRIPTIONS[variant]}</span>
              </button>
            ))}
          </div>
        </form>
      </Modal>
    </>
  );
}
