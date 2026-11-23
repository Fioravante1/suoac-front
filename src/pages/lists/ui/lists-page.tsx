"use client";

import { CalendarX } from "lucide-react";

import { ExportPassengersButton } from "@/features/export-event-passengers";
import { useWorkingEvent } from "@/features/select-event";
import { useAuthPermissions } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { SkeletonText } from "@/shared/ui/skeleton";

import styles from "./lists-page.module.css";

/**
 * Aba Listas e exportações do painel enquanto a Fatia 8 (SUC-12) não chega: a exportação de
 * inscritos que hoje só existe no detalhe do evento, para o evento em que o painel trabalha.
 * Decisão do usuário em 13/11/2026, no SUC-108.
 */
export function ListsPage() {
  const { userCircuitId, userRole } = useAuthPermissions();
  const { event, isLoading, isError, refetch } = useWorkingEvent(userCircuitId);

  const hasFailed = !isLoading && isError;
  const hasNoEvent = !isLoading && !isError && !event;

  return (
    <div className={styles.page}>
      <PageHeader title="Listas e exportações" description="Baixe as listas de inscritos do evento." />

      {isLoading && (
        <Card>
          <SkeletonText lines={2} />
        </Card>
      )}

      {hasFailed && (
        <ErrorState
          title="Não foi possível carregar o evento"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="primary" onClick={refetch}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {hasNoEvent && (
        <EmptyState
          icon={<CalendarX size={48} aria-hidden="true" />}
          title="Nenhum evento para exportar"
          description="As listas de inscritos aparecem aqui quando houver um evento em andamento no circuito."
        />
      )}

      {event && userRole && (
        <Card>
          <div className={styles.export}>
            <div className={styles.exportText}>
              <h2 className={styles.exportTitle}>Inscritos de {event.title}</h2>
              <p className={styles.exportDescription}>
                Lista para a empresa de ônibus ou lista de embarque, em PDF ou Excel.
              </p>
            </div>
            <ExportPassengersButton event={event} userRole={userRole} />
          </div>
        </Card>
      )}
    </div>
  );
}
