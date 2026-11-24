"use client";

import { createPortal } from "react-dom";

import type { Event } from "@/entities/event";
import { EnrollPassengerModal, useEnrollPassengerMutation } from "@/features/enroll-passenger";
import { useAuthPermissions } from "@/shared/auth";
import { LegacyThemeScope } from "@/shared/theme";

type EnrollPassengerDialogProps = Readonly<{ event: Event; onClose: () => void }>;

/**
 * O modal de inscrição de hoje, o mesmo do detalhe do evento, aberto pelo Cadastrar passageiro
 * do resumo e pelo dock de ações rápidas, até a Fatia 4 (SUC-8) redesenhar o cadastro.
 *
 * Sai do shell por um portal: o `Modal` antigo é desenhado no lugar em que é montado, e dentro
 * do resumo herdaria o texto branco do navy e sumiria com ele abaixo de 1280px. No
 * `LegacyThemeScope`, fica no tema claro, como toda tela v1, até a Fatia 4. Quem abre só o
 * monta depois do clique, já no navegador: o portal precisa do `document`.
 */
export function EnrollPassengerDialog({ event, onClose }: EnrollPassengerDialogProps) {
  const { userCongregationId, isCircuitUser } = useAuthPermissions();
  const enrollMutation = useEnrollPassengerMutation(event.id);

  return createPortal(
    <LegacyThemeScope>
      <EnrollPassengerModal
        open
        onClose={onClose}
        onSubmit={(payload) => enrollMutation.mutateAsync(payload)}
        event={event}
        isCircuitUser={isCircuitUser}
        congregationId={userCongregationId ?? ""}
      />
    </LegacyThemeScope>,
    document.body,
  );
}
