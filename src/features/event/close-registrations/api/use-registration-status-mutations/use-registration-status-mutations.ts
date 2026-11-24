import type { Event } from "@/entities/event";
import { queryKeys, useIsMutating, useMutation, useQueryClient, type ActionResult } from "@/shared/api";
import { redirectOnAuthError } from "@/shared/auth";
import { useToast } from "@/shared/ui/toast";

import { closeRegistrationsAction, reopenRegistrationsAction } from "../registration-status-action";

const CLOSE_FAILURE_MESSAGE = "Não foi possível encerrar as inscrições.";
const REOPEN_FAILURE_MESSAGE = "Não foi possível reabrir as inscrições.";

const SELECTED_EVENT_SEGMENT = queryKeys.events.selected("")[2];

/**
 * O evento muda de status na faixa, no resumo, nas etapas e no seletor, e o painel agrega o
 * status. Recarrega também quando a troca falha: o evento pode ter mudado por outro caminho,
 * como o ciclo de vida que encerra no prazo, e a tela não pode seguir com o estado antigo.
 *
 * A seleção fica de fora: recarregá-la escolheria o evento de novo e, sem escolha salva,
 * cairia no evento atual do circuito, que prefere um evento aberto ao que acabou de ser
 * encerrado. O detalhe, que faixa, resumo e abas leem, já traz o status novo.
 */
function useRefreshEvent(): () => void {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.events.all,
      predicate: (query) => query.queryKey[2] !== SELECTED_EVENT_SEGMENT,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

/** A chamada da action também falha sem resposta, como sem rede ou depois de um deploy. */
function failWith(message: string): ActionResult<Event> {
  return { success: false, error: message };
}

/*
 * Sem rede, o modo padrão do TanStack seguraria a troca até a conexão voltar: a confirmação
 * ficaria presa em "Encerrando…", sem como cancelar, e a troca sairia depois sozinha. Com
 * `always`, a action falha na hora e a falha vira mensagem.
 */
const NETWORK_MODE = "always";

/** Encerra as inscrições. O erro fica com quem chama: a confirmação o mostra. */
export function useCloseRegistrationsMutation(eventId: string) {
  const refreshEvent = useRefreshEvent();
  const toast = useToast();

  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: () => closeRegistrationsAction(eventId).catch(() => failWith(CLOSE_FAILURE_MESSAGE)),
    onSuccess: (result) => {
      if (result.success) toast.success("Inscrições encerradas.");
    },
    onSettled: refreshEvent,
  });
}

/**
 * Reabre as inscrições, sem confirmação, como no `v3`: o resultado, bom ou ruim, vira toast. A
 * sessão expirada leva ao login, como na confirmação de encerrar.
 *
 * Resumo, Início e dock reabrem pela mesma chave: enquanto um reabre, os outros esperam, em vez
 * de mandar uma segunda troca que a API recusaria.
 */
export function useReopenRegistrations(eventId: string) {
  const mutationKey = ["suoac", "mutations", "reopen-registrations", eventId] as const;
  const isReopening = useIsMutating({ mutationKey }) > 0;
  const queryClient = useQueryClient();
  const refreshEvent = useRefreshEvent();
  const toast = useToast();

  const { mutate } = useMutation({
    mutationKey,
    networkMode: NETWORK_MODE,
    mutationFn: () => reopenRegistrationsAction(eventId).catch(() => failWith(REOPEN_FAILURE_MESSAGE)),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Inscrições reabertas.");
        return;
      }

      if (redirectOnAuthError(result.error)) return;

      toast.error(result.error.trim() || REOPEN_FAILURE_MESSAGE);
    },
    onSettled: refreshEvent,
  });

  // O cache sabe na hora que uma troca começou; `isReopening` só chega no render seguinte.
  function reopen() {
    if (queryClient.isMutating({ mutationKey }) > 0) return;

    mutate();
  }

  return { reopen, isReopening };
}
