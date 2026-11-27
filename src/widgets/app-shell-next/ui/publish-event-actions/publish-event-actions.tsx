"use client";

import Link from "next/link";

import { usePublishEvent } from "@/features/event/publish-event";
import { routes } from "@/shared/config";

import styles from "./publish-event-actions.module.css";

/**
 * Ações de edição e publicação do hero desktop, com trava de envio compartilhada
 * com o card do rascunho e mensagem inline quando a publicação falha.
 */
export function PublishEventActions({ eventId }: Readonly<{ eventId: string }>) {
  const { publish, isPublishing, error } = usePublishEvent(eventId);

  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        <Link href={routes.eventDetail(eventId)}>Editar evento</Link>
        <button type="button" onClick={publish} disabled={isPublishing} aria-busy={isPublishing}>
          {isPublishing ? "Publicando…" : "Publicar e abrir inscrições"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
