"use client";

import { useEventOverview } from "../../model";
import { QuickActionsMenu } from "../quick-actions-menu";

/**
 * O dock de ações rápidas do desktop (`SUOAC Dashboard.dc.html`): o botão "+" fixo no meio do
 * rodapé abre Cadastrar passageiro, Registrar pagamento, Exportar listas e Encerrar (ou
 * Reabrir) inscrições, cada uma com a dica e o atalho de teclado (N, P, E, X), que vale
 * também com o menu fechado. Reabrir só sai pelo menu, sem atalho. O `v3` não desenhou o dock;
 * o design o revisa no SUC-129.
 *
 * As ações são do circuito, no evento selecionado na faixa. Registrar pagamento leva aos
 * inscritos do evento, onde o pagamento é registrado hoje, e Exportar listas à aba Listas.
 *
 * Precisa do `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function QuickActionsDock() {
  const state = useEventOverview();

  if (state.status !== "ready" || !state.isCircuitUser) return null;

  return (
    <QuickActionsMenu event={state.event} canEnroll={state.canEnroll} registrationAction={state.registrationAction} />
  );
}
