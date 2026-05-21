"use client";

import { useAuth } from "@/shared/auth";
import { useQuery, useMutation, useQueryClient, queryKeys } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { SkeletonTableRows } from "@/shared/ui/skeleton";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useModal, usePagination } from "@/shared/lib";

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

  const { page, setPage } = usePagination();
  const formModal = useModal<Congregation>();
  const deleteModal = useModal<Congregation>();

  const { data, isLoading } = useQuery(congregationListOptions(circuitId, page));

  const createMutation = useMutation({
    mutationFn: (dto: CongregationFormValues) => createCongregationAction(circuitId, dto),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all });
        formModal.close();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CongregationFormValues }) => updateCongregationAction(id, dto),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all });
        formModal.close();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCongregationAction(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.congregations.all });
      }
      deleteModal.close();
    },
  });

  async function handleFormSubmit(values: CongregationFormValues) {
    if (formModal.item) {
      return updateMutation.mutateAsync({ id: formModal.item.id, dto: values });
    }

    return createMutation.mutateAsync(values);
  }

  function handleConfirmDelete() {
    if (!deleteModal.item) return;
    deleteMutation.mutate(deleteModal.item.id);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Congregações"
        description="Gerencie as congregações do circuito."
        action={<Button onClick={() => formModal.open()}>+ Nova Congregação</Button>}
      />

      <div className={styles.content}>
        {isLoading && <SkeletonTableRows rows={10} />}

        {data && data.data.length === 0 && (
          <EmptyState
            icon="🏛️"
            title="Nenhuma congregação cadastrada"
            description="Adicione a primeira congregação do circuito para começar."
            action={<Button onClick={() => formModal.open()}>+ Nova Congregação</Button>}
          />
        )}

        {data && data.data.length > 0 && (
          <>
            <CongregationTable
              congregations={data.data}
              onEdit={(c) => formModal.open(c)}
              onDelete={(c) => deleteModal.open(c)}
            />
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <CongregationFormModal
        open={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleFormSubmit}
        congregation={formModal.item}
      />

      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        title="Excluir Congregação"
        message={`Tem certeza que deseja excluir a congregação "${deleteModal.item?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
