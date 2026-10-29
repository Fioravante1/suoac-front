"use client";

import { useState, type ChangeEvent } from "react";
import { CalendarX } from "lucide-react";

import { congregationSelectOptions } from "@/entities/congregation";
import { eventPassengersFinancialOptions, financialSummaryOptions } from "@/entities/event-passenger";
import { useQuery } from "@/shared/api";
import { useAuthPermissions } from "@/shared/auth";
import { usePagination } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Select } from "@/shared/ui/select";
import { SkeletonCardGrid, SkeletonTableRows } from "@/shared/ui/skeleton";

import { CongregationFinancialList, FinancialSummaryCards } from "@/widgets/financial-summary";
import {
  FinancialPassengersTable,
  PaymentStatusFilter,
  type PaymentStatusFilterValue,
} from "@/widgets/financial-passengers";

import { useFinancialEvent } from "../model";

import styles from "./financial-page.module.css";

export function FinancialPage() {
  const { userCircuitId, isCircuitUser } = useAuthPermissions();
  const { page, setPage, reset } = usePagination();

  const [filter, setFilter] = useState<PaymentStatusFilterValue>("ALL");

  const {
    events,
    eventId: resolvedEventId,
    isBootstrapping,
    isError: isEventError,
    retry: retryEvent,
    isChangingEvent,
    changeEvent,
  } = useFinancialEvent(userCircuitId);

  const paymentStatus = filter === "ALL" ? undefined : filter;

  const summaryQuery = useQuery(financialSummaryOptions(resolvedEventId));
  const passengersQuery = useQuery(eventPassengersFinancialOptions(resolvedEventId, page, paymentStatus));
  const congregationsQuery = useQuery({ ...congregationSelectOptions(userCircuitId), enabled: isCircuitUser });

  const congregationNameById: Record<string, string> = {};
  for (const congregation of congregationsQuery.data?.data ?? []) {
    congregationNameById[congregation.id] = congregation.name;
  }

  function handleEventChange(event: ChangeEvent<HTMLSelectElement>) {
    changeEvent(event.target.value);
    setFilter("ALL");
    reset();
  }

  function handleFilterChange(value: PaymentStatusFilterValue) {
    setFilter(value);
    reset();
  }

  const hasEvents = events.length > 0;
  const showsEventError = !isBootstrapping && isEventError;
  const hasNoEvent = !isBootstrapping && !isEventError && !resolvedEventId;
  const showsContent = !isBootstrapping && !isEventError && Boolean(resolvedEventId);

  const eventSelector = hasEvents && (
    <Select
      aria-label="Selecionar evento"
      value={resolvedEventId}
      onChange={handleEventChange}
      disabled={isChangingEvent}
      // Sem evento ainda, a opção vazia evita que o navegador mostre o primeiro evento como escolhido.
      placeholder={resolvedEventId ? undefined : "Selecione um evento"}
      options={events.map((event) => ({ value: event.id, label: event.title }))}
    />
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Financeiro"
        description="Acompanhe pagamentos e resumos financeiros por evento."
        action={eventSelector}
      />

      {isBootstrapping && (
        <>
          <SkeletonCardGrid count={3} />
          <Card>
            <SkeletonTableRows rows={5} />
          </Card>
        </>
      )}

      {showsEventError && (
        <ErrorState
          title="Não foi possível carregar o evento"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="primary" onClick={retryEvent}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {hasNoEvent && !hasEvents && (
        <EmptyState
          icon={<CalendarX size={48} />}
          title="Nenhum evento"
          description="Não há eventos no circuito para exibir o financeiro."
        />
      )}

      {hasNoEvent && hasEvents && (
        <EmptyState
          icon={<CalendarX size={48} />}
          title="Nenhum evento selecionado"
          description="Escolha um evento para ver o financeiro."
        />
      )}

      {showsContent && (
        <>
          {summaryQuery.isLoading && <SkeletonCardGrid count={3} />}

          {!summaryQuery.isLoading && summaryQuery.isError && (
            <ErrorState
              title="Não foi possível carregar o resumo financeiro"
              description="Verifique sua conexão e tente novamente."
              action={
                <Button variant="primary" onClick={() => summaryQuery.refetch()}>
                  Tentar novamente
                </Button>
              }
            />
          )}

          {summaryQuery.data && (
            <>
              <FinancialSummaryCards totals={summaryQuery.data.totals} />

              {isCircuitUser && <CongregationFinancialList congregations={summaryQuery.data.congregations} />}

              <Card>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Inscrições</h2>
                </div>

                <PaymentStatusFilter
                  value={filter}
                  onChange={handleFilterChange}
                  counts={summaryQuery.data.totals.byStatus}
                  total={summaryQuery.data.totals.totalPassengers}
                />

                <div className={styles.tableArea}>
                  {passengersQuery.isFetching && <SkeletonTableRows rows={5} />}

                  {!passengersQuery.isFetching && passengersQuery.isError && (
                    <ErrorState
                      title="Não foi possível carregar os passageiros"
                      description="Verifique sua conexão e tente novamente."
                      action={
                        <Button variant="primary" onClick={() => passengersQuery.refetch()}>
                          Tentar novamente
                        </Button>
                      }
                    />
                  )}

                  {!passengersQuery.isFetching && passengersQuery.data && (
                    <FinancialPassengersTable
                      passengers={passengersQuery.data.data}
                      isCircuitUser={isCircuitUser}
                      congregationNameById={congregationNameById}
                      page={page}
                      totalPages={passengersQuery.data.meta.totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
