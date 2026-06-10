"use client";

import { Calendar } from "lucide-react";

import { useQuery } from "@/shared/api";
import { useAuthPermissions } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";

import { activeEventOptions, dashboardOptions } from "../api";

import { CongregationSummaryList } from "./congregation-summary-list";
import { DashboardAlerts } from "./dashboard-alerts";
import { DashboardGreeting } from "./dashboard-greeting";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardStatsGrid } from "./dashboard-stats-grid";
import { EventHeroCard } from "./event-hero-card";
import { PaymentProgressBar } from "./payment-progress-bar";
import styles from "./dashboard-page.module.css";

export function DashboardPage() {
  const { user, userCircuitId, userCongregationId, isCircuitUser } = useAuthPermissions();

  const activeEventQuery = useQuery(activeEventOptions(userCircuitId));

  const activeEvent = activeEventQuery.data;
  const activeEventId = activeEvent?.id ?? "";

  const dashboardQuery = useQuery(
    dashboardOptions(activeEventId, isCircuitUser ? undefined : (userCongregationId ?? undefined)),
  );

  const isLoading = activeEventQuery.isLoading || (activeEventId && dashboardQuery.isLoading);
  const isError = activeEventQuery.isError || dashboardQuery.isError;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Nao foi possivel carregar o dashboard"
        description="Verifique sua conexao e tente novamente."
        action={
          <Button
            variant="primary"
            onClick={() => {
              activeEventQuery.refetch();
              dashboardQuery.refetch();
            }}
          >
            Tentar novamente
          </Button>
        }
      />
    );
  }

  if (!activeEvent) {
    return (
      <div className={styles.page}>
        <DashboardGreeting userName={user?.name ?? "Usuario"} congregationName={null} isCircuitUser={isCircuitUser} />
        <EmptyState
          icon={<Calendar size={48} />}
          title="Nenhum evento ativo"
          description="Nao ha eventos com inscricoes abertas no momento. Crie um novo evento para comecar."
        />
      </div>
    );
  }

  const dashboard = dashboardQuery.data;

  if (!dashboard) return null;

  return (
    <div className={styles.page}>
      <DashboardGreeting
        userName={user?.name ?? "Usuario"}
        congregationName={dashboard.congregation?.name ?? null}
        isCircuitUser={isCircuitUser}
      />

      <EventHeroCard event={dashboard.event} />

      <DashboardAlerts
        event={dashboard.event}
        totalPendingPassengers={dashboard.totalPendingPassengers}
        totalPending={dashboard.stats.totalPending}
      />

      <DashboardStatsGrid stats={dashboard.stats} />

      <PaymentProgressBar breakdown={dashboard.paymentBreakdown} />

      {isCircuitUser && dashboard.congregationSummaries && (
        <CongregationSummaryList summaries={dashboard.congregationSummaries} />
      )}
    </div>
  );
}
