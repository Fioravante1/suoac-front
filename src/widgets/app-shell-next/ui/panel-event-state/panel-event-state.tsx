"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useSelectedEvent } from "@/features/select-event";
import { useAuthPermissions } from "@/shared/auth";
import { routes } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";

import { PANEL_MODES, resolvePanelMode } from "../../model";
import { PanelEmptyState } from "../panel-empty-state";
import { PanelDraftState } from "../panel-draft-state";
import { PanelCancelledState } from "../panel-cancelled-state";

/**
 * Fachada dos estados alternativos do dashboard para o shell novo (SUC-115).
 * Outras rotas e os papéis da congregação preservam o conteúdo da página.
 */
export function PanelEventState({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const selection = useSelectedEvent();
  const { isCircuitUser } = useAuthPermissions();
  if (pathname !== routes.dashboard || !selection) return children;
  if (selection.isError)
    return (
      <ErrorState
        title="Não foi possível carregar o evento"
        description="Verifique sua conexão e tente novamente."
        action={
          <Button type="button" onClick={selection.refetch}>
            Tentar de novo
          </Button>
        }
      />
    );
  const { event } = selection;
  const mode = resolvePanelMode(event, isCircuitUser);
  if (selection.isLoading) return <Skeleton aria-label="Carregando o painel" />;
  if (!isCircuitUser) return children;
  if (mode === PANEL_MODES.EMPTY) return <PanelEmptyState />;
  if (mode === PANEL_MODES.DRAFT && event) return <PanelDraftState key={event.id} event={event} />;
  if (mode === PANEL_MODES.CANCELLED && event) return <PanelCancelledState event={event} />;
  return children;
}
