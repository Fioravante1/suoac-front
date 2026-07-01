"use client";

import { useState, type ChangeEvent } from "react";
import { CalendarX } from "lucide-react";

import { activeEventOptions, eventSelectOptions } from "@/entities/event";
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

import styles from "./financial-page.module.css";

export function FinancialPage() {
  const { userCircuitId, isCircuitUser } = useAuthPermissions();
  const { page, setPage, reset } = usePagination();

  const [selectedEventId, setSelectedEventId] = useState("");
  const [filter, setFilter] = useState<PaymentStatusFilterValue>("ALL");

  const eventsQuery = useQuery(eventSelectOptions(userCircuitId));
  const activeEventQuery = useQuery(activeEventOptions(userCircuitId));

  const events = eventsQuery.data?.data ?? [];
  // Default: evento ativo (OPEN); se não houver, o primeiro da lista. A escolha do usuário prevalece.
  const resolvedEventId = selectedEventId || activeEventQuery.data?.id || events[0]?.id || "";

  const paymentStatus = filter === "ALL" ? undefined : filter;

  const summaryQuery = useQuery(financialSummaryOptions(resolvedEventId));
  const passengersQuery = useQuery(eventPassengersFinancialOptions(resolvedEventId, page, paymentStatus));
  const congregationsQuery = useQuery({ ...congregationSelectOptions(userCircuitId), enabled: isCircuitUser });

  const congregationNameById: Record<string, string> = {};
  for (const congregation of congregationsQuery.data?.data ?? []) {
    congregationNameById[congregation.id] = congregation.name;
  }

  function handleEventChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedEventId(event.target.value);
    setFilter("ALL");
    reset();
  }

  function handleFilterChange(value: PaymentStatusFilterValue) {
    setFilter(value);
    reset();
  }

  const isBootstrapping = eventsQuery.isLoading || activeEventQuery.isLoading;

  const eventSelector = events.length > 0 && (
    <Select
      aria-label="Selecionar evento"
      value={resolvedEventId}
      onChange={handleEventChange}
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

      {!isBootstrapping && !resolvedEventId && (
        <EmptyState
          icon={<CalendarX size={48} />}
          title="Nenhum evento"
          description="Não há eventos no circuito para exibir o financeiro."
        />
      )}

      {!isBootstrapping && resolvedEventId && (
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
