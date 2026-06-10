"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Users } from "lucide-react";

import { congregationSelectOptions } from "@/entities/congregation/api";
import type { Passenger, PassengerFormValues } from "@/entities/passenger";
import { passengerListByCircuitOptions, passengerListOptions } from "@/entities/passenger/api";

import { createPassengerAction } from "@/features/create-passenger";
import { deletePassengerAction } from "@/features/delete-passenger";
import { updatePassengerAction } from "@/features/update-passenger";

import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { isCircuitRole, useAuth } from "@/shared/auth";
import { useDebouncedValue, useModal, usePagination } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { SkeletonTableRows } from "@/shared/ui/skeleton";
import { TextField } from "@/shared/ui/text-field";
import { Tooltip } from "@/shared/ui/tooltip";

import { PassengerFormModal } from "./passenger-form-modal";
import { PassengerTable } from "./passenger-table";

import styles from "./passengers-page.module.css";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível carregar os passageiros.";
}

export function PassengersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { page, setPage } = usePagination();
  const formModal = useModal<Passenger>();
  const deleteModal = useModal<Passenger>();
  const circuitId = user?.circuitId ?? "";
  const userCongregationId = user?.congregationId ?? "";
  const canSelectCongregation = user ? isCircuitRole(user.role) : false;

  const [selectedCongregationId, setSelectedCongregationId] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const activeSearch = debouncedSearch.length >= 3 ? debouncedSearch : "";
  const [pageError, setPageError] = useState<string | null>(null);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [activeSearch, setPage]);

  const congregationQuery = useQuery({
    ...congregationSelectOptions(circuitId),
    enabled: Boolean(circuitId && canSelectCongregation),
  });

  const activeCongregationId = canSelectCongregation ? selectedCongregationId : userCongregationId;

  const circuitPassengerQuery = useQuery({
    ...passengerListByCircuitOptions(circuitId, page, activeSearch, selectedCongregationId),
    enabled: Boolean(circuitId && canSelectCongregation),
  });

  const congregationPassengerQuery = useQuery({
    ...passengerListOptions(userCongregationId, page, activeSearch),
    enabled: Boolean(userCongregationId && !canSelectCongregation),
  });

  const passengerQuery = canSelectCongregation ? circuitPassengerQuery : congregationPassengerQuery;

  const createMutation = useMutation({
    mutationFn: (values: PassengerFormValues) => createPassengerAction(activeCongregationId, values),
    onSuccess: (result) => {
      if (!result.success) return;

      setPageError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.passengers.all });
      formModal.close();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PassengerFormValues }) => updatePassengerAction(id, values),
    onSuccess: (result) => {
      if (!result.success) return;

      setPageError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.passengers.all });
      formModal.close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePassengerAction(id),
    onSuccess: (result) => {
      if (result.success) {
        setPageError(null);
        queryClient.invalidateQueries({ queryKey: queryKeys.passengers.all });
      }

      if (!result.success) {
        setPageError(result.error);
      }

      deleteModal.close();
    },
  });

  async function handleFormSubmit(values: PassengerFormValues) {
    if (formModal.item) {
      return updateMutation.mutateAsync({ id: formModal.item.id, values });
    }

    return createMutation.mutateAsync(values);
  }

  function handleConfirmDelete() {
    if (!deleteModal.item) return;
    deleteMutation.mutate(deleteModal.item.id);
  }

  function handleClearSearch() {
    setSearch("");
    setPage(1);
  }

  function handleCongregationChange(congregationId: string) {
    setSelectedCongregationId(congregationId);
    setPage(1);
    setSearch("");
  }

  const hasPassengers = Boolean(passengerQuery.data && passengerQuery.data.data.length > 0);
  const isEmpty = Boolean(passengerQuery.data && passengerQuery.data.data.length === 0);
  const emptyTitle = activeSearch ? "Nenhum passageiro encontrado" : "Nenhum passageiro cadastrado";
  const emptyDescription = activeSearch
    ? "Revise o nome ou RG pesquisado e tente novamente."
    : "Cadastre o primeiro passageiro da congregação para reaproveitar os dados em inscrições futuras.";
  const canCreatePassenger = canSelectCongregation ? Boolean(selectedCongregationId) : Boolean(userCongregationId);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Passageiros"
        description="Gerencie o cadastro base de passageiros por congregação."
        action={
          !canCreatePassenger ? (
            <Tooltip content="Selecione uma congregação para cadastrar">
              <Button disabled>+ Novo passageiro</Button>
            </Tooltip>
          ) : (
            <Button onClick={() => formModal.open()}>+ Novo passageiro</Button>
          )
        }
      />

      {pageError && (
        <div className={styles.errorBanner} role="alert">
          {pageError}
        </div>
      )}

      <section className={styles.toolbar} aria-label="Filtros de passageiros">
        {canSelectCongregation && (
          <label className={styles.selectGroup}>
            <span className={styles.selectLabel}>Congregação</span>
            <select
              className={styles.select}
              value={selectedCongregationId}
              onChange={(event) => handleCongregationChange(event.target.value)}
              disabled={congregationQuery.isLoading}
            >
              <option value="">Todas as congregações</option>
              {congregationQuery.data?.data.map((congregation) => (
                <option key={congregation.id} value={congregation.id}>
                  {congregation.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className={styles.searchGroup}>
          <TextField
            aria-label="Buscar passageiro por nome ou RG"
            placeholder="Buscar por nome ou RG"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startIcon={<Search size={18} />}
          />
          {search && (
            <Button type="button" variant="secondary" onClick={handleClearSearch}>
              Limpar
            </Button>
          )}
        </div>
      </section>

      {passengerQuery.isError && (
        <ErrorState
          title="Não foi possível carregar passageiros"
          description={getErrorMessage(passengerQuery.error)}
          action={<Button onClick={() => passengerQuery.refetch()}>Tentar novamente</Button>}
        />
      )}

      {!passengerQuery.isError && (
        <div className={styles.content}>
          {passengerQuery.isLoading && <SkeletonTableRows rows={10} />}

          {isEmpty && (
            <EmptyState
              icon={<Users size={48} strokeWidth={1.5} />}
              title={emptyTitle}
              description={emptyDescription}
              action={
                !activeSearch && canCreatePassenger ? (
                  <Button onClick={() => formModal.open()}>+ Novo passageiro</Button>
                ) : undefined
              }
            />
          )}

          {hasPassengers && (
            <>
              <PassengerTable
                passengers={passengerQuery.data?.data ?? []}
                onEdit={(passenger) => formModal.open(passenger)}
                onDelete={(passenger) => deleteModal.open(passenger)}
                showCongregation={canSelectCongregation}
              />
              <Pagination
                page={passengerQuery.data?.meta.page ?? 1}
                totalPages={passengerQuery.data?.meta.totalPages ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}

      <PassengerFormModal
        open={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleFormSubmit}
        passenger={formModal.item}
      />

      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        title="Excluir passageiro"
        message={`Tem certeza que deseja excluir o passageiro "${deleteModal.item?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
