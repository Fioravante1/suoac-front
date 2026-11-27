"use client";

import {
  CONGREGATION_LIST_STATUSES,
  congregationEventStatusOptions,
  type CongregationListStatus,
} from "@/entities/congregation";
import { queryKeys, useIsMutating, useMutation, useQueryClient } from "@/shared/api";
import { redirectOnAuthError } from "@/shared/auth";
import { useToast } from "@/shared/ui/toast";

import { updateCongregationListStatusAction } from "../update-congregation-list-status-action";

const FAILURE_MESSAGE = "Não foi possível atualizar a lista.";

/** Trava compartilhada entre os dois resumos; só altera o cache após confirmação da API. */
export function useToggleCongregationListStatus(eventId: string, congregationId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutationKey = ["suoac", "mutations", "congregation-list-status", eventId, congregationId] as const;
  const isUpdating = useIsMutating({ mutationKey }) > 0;
  function refreshState() {
    queryClient.invalidateQueries({ queryKey: congregationEventStatusOptions(eventId, congregationId).queryKey });
    queryClient.invalidateQueries({ queryKey: queryKeys.congregations.eventStatuses(eventId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.events.all,
      predicate: (query) => query.queryKey[2] !== queryKeys.events.selected("")[2],
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }

  const { mutate } = useMutation({
    onSettled: refreshState,
    mutationKey,
    networkMode: "always",
    mutationFn: (status: CongregationListStatus) =>
      updateCongregationListStatusAction(eventId, congregationId, status).catch(() => ({
        success: false as const,
        error: FAILURE_MESSAGE,
      })),
    onSuccess: (result) => {
      if (!result.success) {
        if (redirectOnAuthError(result.error)) return;
        toast.error(result.error.trim() || FAILURE_MESSAGE);
        return;
      }
      queryClient.setQueryData(congregationEventStatusOptions(eventId, congregationId).queryKey, result.data);
      toast.success(
        result.data.status === CONGREGATION_LIST_STATUSES.FINALIZED ? "Lista enviada ao circuito." : "Lista reaberta.",
      );
    },
  });
  function toggle(status: CongregationListStatus) {
    if (queryClient.isMutating({ mutationKey }) > 0) return;
    mutate(status);
  }
  return { toggle, isUpdating };
}
