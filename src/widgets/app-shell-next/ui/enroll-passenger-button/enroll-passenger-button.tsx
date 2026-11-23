"use client";

import { createPortal } from "react-dom";
import { Plus } from "lucide-react";

import type { Event } from "@/entities/event";
import { EnrollPassengerModal, useEnrollPassengerMutation } from "@/features/enroll-passenger";
import { useAuthPermissions } from "@/shared/auth";
import { useModal } from "@/shared/lib";
import { LegacyThemeScope } from "@/shared/theme";

import styles from "./enroll-passenger-button.module.css";

type EnrollPassengerButtonProps = Readonly<{ event: Event }>;

/**
 * Cadastrar passageiro, a ação principal do resumo do evento no desktop (`v3`). Até a Fatia 4
 * (SUC-8) redesenhar o cadastro, abre o modal de inscrição de hoje, o mesmo do detalhe do evento.
 *
 * O modal sai do resumo por um portal: o `Modal` antigo é desenhado no lugar em que é montado, e
 * dentro do resumo herdaria o texto branco do navy e sumiria com ele abaixo de 1280px. No
 * `LegacyThemeScope`, fica no tema claro, como toda tela v1, até a Fatia 4.
 */
export function EnrollPassengerButton({ event }: EnrollPassengerButtonProps) {
  const { userCongregationId, isCircuitUser } = useAuthPermissions();
  const enrollModal = useModal();
  const enrollMutation = useEnrollPassengerMutation(event.id);

  return (
    <>
      <button type="button" className={styles.button} onClick={() => enrollModal.open()}>
        <Plus size={16} strokeWidth={2} aria-hidden="true" />
        Cadastrar passageiro
      </button>

      {/* Só existe depois do clique, já no navegador: o portal precisa do `document`. */}
      {enrollModal.isOpen &&
        createPortal(
          <LegacyThemeScope>
            <EnrollPassengerModal
              open
              onClose={enrollModal.close}
              onSubmit={(payload) => enrollMutation.mutateAsync(payload)}
              event={event}
              isCircuitUser={isCircuitUser}
              congregationId={userCongregationId ?? ""}
            />
          </LegacyThemeScope>,
          document.body,
        )}
    </>
  );
}
