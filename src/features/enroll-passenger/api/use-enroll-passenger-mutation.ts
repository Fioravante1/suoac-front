import { queryKeys, useMutation, useQueryClient } from "@/shared/api";
import { useToast } from "@/shared/ui/toast";

import type { EnrollPassengerPayload } from "../model";

import { enrollPassengerAction } from "./enroll-passenger-action";

/**
 * Inscreve um passageiro no evento e recarrega o que a inscrição muda. As três telas que abrem o
 * `EnrollPassengerModal` (detalhe do evento, lista de eventos e resumo do painel novo) usam esta,
 * para as invalidações não divergirem de uma para outra.
 */
export function useEnrollPassengerMutation(eventId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: EnrollPassengerPayload) => enrollPassengerAction(eventId, payload),
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.eventPassengers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      // Inscrever alguém novo também o cadastra: o cadastro de passageiros muda junto.
      queryClient.invalidateQueries({ queryKey: queryKeys.passengers.all });
      // O painel e o financeiro agregam contagens e valores das inscrições.
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.financialSummary.all });
      toast.success("Passageiro inscrito com sucesso.");
    },
  });
}
