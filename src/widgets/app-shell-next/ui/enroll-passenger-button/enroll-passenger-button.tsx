"use client";

import { Plus } from "lucide-react";

import type { Event } from "@/entities/event";
import { useModal } from "@/shared/lib";

import { EnrollPassengerDialog } from "../enroll-passenger-dialog";

import styles from "./enroll-passenger-button.module.css";

type EnrollPassengerButtonProps = Readonly<{ event: Event }>;

/**
 * Cadastrar passageiro, a ação principal do resumo do evento no desktop (`v3`). Abre o modal de
 * inscrição de hoje (`EnrollPassengerDialog`) até a Fatia 4 (SUC-8) redesenhar o cadastro.
 */
export function EnrollPassengerButton({ event }: EnrollPassengerButtonProps) {
  const enrollModal = useModal();

  return (
    <>
      <button type="button" className={styles.button} onClick={() => enrollModal.open()}>
        <Plus size={16} strokeWidth={2} aria-hidden="true" />
        Cadastrar passageiro
      </button>

      {enrollModal.isOpen && <EnrollPassengerDialog event={event} onClose={enrollModal.close} />}
    </>
  );
}
