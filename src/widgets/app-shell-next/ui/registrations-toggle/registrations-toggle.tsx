"use client";

import type { Event } from "@/entities/event";
import { CloseRegistrationsDialog, useReopenRegistrations } from "@/features/event/close-registrations";
import { useModal } from "@/shared/lib";

import { REGISTRATION_ACTIONS, type RegistrationAction } from "../../model";

import styles from "./registrations-toggle.module.css";

type RegistrationsToggleProps = Readonly<{
  event: Pick<Event, "id" | "registrationDeadline" | "days">;
  /** Encerrar ou Reabrir; `null` não mostra botão. */
  action: RegistrationAction | null;
}>;

/**
 * Encerrar ou reabrir as inscrições, o botão de contorno sobre o navy do resumo do evento
 * (`v3`, 42px) e do hero do Início (`Dashboard Mobile`, 44px).
 *
 * Encerrar pede confirmação. Reabrir é direto, como no `v3`, e só aparece para as inscrições
 * encerradas que ainda reabrem: o resultado vira toast, porque não há confirmação para mostrá-lo.
 *
 * Os dois são o mesmo botão, que troca de rótulo como no `v3`: quando as inscrições mudam, o foco
 * continua nele. Enquanto reabre, ele fica `aria-disabled`, porque `disabled` tiraria o foco.
 *
 * A confirmação só é montada quando dá para encerrar, e fica montada enquanto aberta, mesmo que
 * o evento recarregado já não deixe encerrar: uma recusa da API continua à vista nela.
 */
export function RegistrationsToggle({ event, action }: RegistrationsToggleProps) {
  const confirmModal = useModal();
  const { reopen, isReopening } = useReopenRegistrations(event.id);
  const isClose = action === REGISTRATION_ACTIONS.CLOSE;
  const isReopen = action === REGISTRATION_ACTIONS.REOPEN;
  const isBusy = isReopen && isReopening;

  function handleClick() {
    if (isBusy) return;

    if (isClose) {
      confirmModal.open();
      return;
    }

    reopen();
  }

  return (
    <>
      {action && (
        <button
          type="button"
          className={styles.button}
          onClick={handleClick}
          aria-disabled={isBusy || undefined}
          aria-busy={isBusy || undefined}
        >
          {isClose && "Encerrar inscrições"}
          {isReopen && !isBusy && "Reabrir inscrições"}
          {isBusy && "Reabrindo…"}
        </button>
      )}
      {(isClose || confirmModal.isOpen) && (
        <CloseRegistrationsDialog event={event} open={confirmModal.isOpen} onClose={confirmModal.close} />
      )}
    </>
  );
}
