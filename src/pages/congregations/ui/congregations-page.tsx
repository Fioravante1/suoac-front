"use client";

import { useState } from "react";

import { useAuth } from "@/shared/auth";
import { useQuery, useMutation, useQueryClient, queryKeys } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

import type { Congregation } from "@/entities/congregation";
import { congregationListOptions } from "@/entities/congregation/api/congregation.options";

import { createCongregationAction } from "../api/create-congregation-action";
import { updateCongregationAction } from "../api/update-congregation-action";
import { deleteCongregationAction } from "../api/delete-congregation-action";
import type { CongregationFormValues } from "../model/congregation-form-schema";

import { CongregationTable } from "./congregation-table";
import { CongregationFormModal } from "./congregation-form-modal";

import styles from "./congregations-page.module.css";

export function CongregationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const circuitId = user?.circuitId ?? "";

  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState<Congregation | null>(null);
  const [deletingCongregation, setDeletingCongregation] = useState<Congregation | null>(null);

  const { data, isLoading, isError, error } = useQuery(congregationListOptions(circuitId, page));

  const createMutation = useMutation({
    mutationFn: (dto: CongregationFormValues) => createCongregationAction(circuitId, dto),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all });
        handleCloseForm();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CongregationFormValues }) => updateCongregationAction(id, dto),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all });
        handleCloseForm();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCongregationAction(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all });
      }
      setDeletingCongregation(null);
    },
  });

  function handleOpenCreate() {
    setEditingCongregation(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(congregation: Congregation) {
    setEditingCongregation(congregation);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingCongregation(null);
  }

  async function handleFormSubmit(values: CongregationFormValues) {
    if (editingCongregation) {
      const result = await updateMutation.mutateAsync({ id: editingCongregation.id, dto: values });
      return result;
    }

    const result = await createMutation.mutateAsync(values);
    return result;
  }

  function handleConfirmDelete() {
    if (!deletingCongregation) return;
    deleteMutation.mutate(deletingCongregation.id);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Congregações"
        description="Gerencie as congregações do circuito."
        action={<Button onClick={handleOpenCreate}>+ Nova Congregação</Button>}
      />

      <div className={styles.content}>
        {isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner size="large" />
          </div>
        )}

        {isError && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>
              {error instanceof Error ? error.message : "Erro ao carregar congregações."}
            </p>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all })}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {data && data.data.length === 0 && (
          <EmptyState
            icon="🏛️"
            title="Nenhuma congregação cadastrada"
            description="Adicione a primeira congregação do circuito para começar."
            action={<Button onClick={handleOpenCreate}>+ Nova Congregação</Button>}
          />
        )}

        {data && data.data.length > 0 && (
          <>
            <CongregationTable
              congregations={data.data}
              onEdit={handleOpenEdit}
              onDelete={(c) => setDeletingCongregation(c)}
            />
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <CongregationFormModal
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        congregation={editingCongregation}
      />

      <ConfirmDialog
        open={Boolean(deletingCongregation)}
        onClose={() => setDeletingCongregation(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Congregação"
        message={`Tem certeza que deseja excluir a congregação "${deletingCongregation?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
