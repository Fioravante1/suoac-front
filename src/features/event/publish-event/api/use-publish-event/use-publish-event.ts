"use client";

import { useState } from "react";

import { eventDetailOptions, type Event } from "@/entities/event";
import { queryKeys, useIsMutating, useMutation, useQueryClient } from "@/shared/api";
import { redirectOnAuthError } from "@/shared/auth";
import { useToast } from "@/shared/ui/toast";

import { publishEventAction } from "../publish-event-action";

const FAILURE_MESSAGE = "Não foi possível publicar o evento.";

/**
 * Publica o rascunho com trava entre hero e card. Recarrega o evento e o painel também
 * quando a API recusa a troca, pois outra aba pode já ter publicado; preserva a seleção.
 */
export function usePublishEvent(eventId: string) {
  const [error, setError] = useState<string | null>(null);
  const mutationKey = ["suoac", "mutations", "publish-event", eventId] as const;
  const isPublishing = useIsMutating({ mutationKey }) > 0;
  const queryClient = useQueryClient();
  const toast = useToast();

  function refreshEvent() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.events.all,
      predicate: (query) => query.queryKey[2] !== queryKeys.events.selected("")[2],
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }

  const { mutate } = useMutation({
    mutationKey,
    onSettled: refreshEvent,
    networkMode: "always",
    mutationFn: () => publishEventAction(eventId).catch(() => ({ success: false as const, error: FAILURE_MESSAGE })),
    onSuccess: (result) => {
      if (result.success) {
        setError(null);
        // PATCH responde sem dias. Preserva os dias do detalhe para não apagar o período do painel.
        queryClient.setQueryData<Event>(eventDetailOptions(eventId).queryKey, (previous) => ({
          ...previous,
          ...result.data,
        }));
        toast.success("Evento publicado · inscrições abertas.");
        return;
      }
      if (redirectOnAuthError(result.error)) return;
      const message = result.error.trim() || FAILURE_MESSAGE;
      setError(message);
      toast.error(message);
    },
  });

  function publish() {
    if (queryClient.isMutating({ mutationKey }) > 0) return;
    setError(null);
    mutate();
  }

  return { publish, isPublishing, error, clearError: () => setError(null) };
}
