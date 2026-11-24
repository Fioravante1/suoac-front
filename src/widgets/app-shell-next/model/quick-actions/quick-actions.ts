import { toEventCalendarDate } from "@/entities/event";
import { formatDayMonth } from "@/shared/lib";

import { REGISTRATION_ACTIONS, type RegistrationAction } from "../event-overview";

export const QUICK_ACTION_IDS = {
  ENROLL: "enroll",
  PAYMENT: "payment",
  EXPORT: "export",
  CLOSE: "close",
  REOPEN: "reopen",
} as const;

export type QuickActionId = (typeof QUICK_ACTION_IDS)[keyof typeof QUICK_ACTION_IDS];

export interface QuickAction {
  id: QuickActionId;
  label: string;
  hint: string;
  /** A tecla do atalho, como aparece no menu; `null` para a ação que só sai pelo menu. */
  shortcut: string | null;
}

type QuickActionsInput = Readonly<{
  registrationDeadline: string;
  canEnroll: boolean;
  registrationAction: RegistrationAction | null;
}>;

/**
 * As ações rápidas do dock do desktop (`SUOAC Dashboard.dc.html`), na ordem do desenho:
 * Cadastrar passageiro, Registrar pagamento, Exportar listas e Encerrar inscrições.
 *
 * Seguem o resumo do evento: Cadastrar só com as inscrições abertas, e a última vira Reabrir
 * inscrições quando elas foram encerradas e ainda reabrem. Reabrir não tem atalho: não pede
 * confirmação, e uma tecla solta apertada por engano abriria as inscrições de novo.
 */
export function getQuickActions(input: QuickActionsInput): QuickAction[] {
  const deadline = formatDayMonth(toEventCalendarDate(input.registrationDeadline));
  const actions: QuickAction[] = [];

  if (input.canEnroll) {
    actions.push({
      id: QUICK_ACTION_IDS.ENROLL,
      label: "Cadastrar passageiro",
      hint: "Nome, RG e dias",
      shortcut: "N",
    });
  }

  actions.push(
    { id: QUICK_ACTION_IDS.PAYMENT, label: "Registrar pagamento", hint: "Total ou parcial", shortcut: "P" },
    { id: QUICK_ACTION_IDS.EXPORT, label: "Exportar listas", hint: "Por dia ou congregação", shortcut: "E" },
  );

  if (input.registrationAction === REGISTRATION_ACTIONS.CLOSE) {
    actions.push({
      id: QUICK_ACTION_IDS.CLOSE,
      label: "Encerrar inscrições",
      hint: `Antes do prazo de ${deadline}`,
      shortcut: "X",
    });
  }

  if (input.registrationAction === REGISTRATION_ACTIONS.REOPEN) {
    actions.push({
      id: QUICK_ACTION_IDS.REOPEN,
      label: "Reabrir inscrições",
      hint: `Até o prazo de ${deadline}`,
      shortcut: null,
    });
  }

  return actions;
}

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

/**
 * A ação cujo atalho a tecla dispara, ou `null`. Uma letra sozinha só vale como atalho quando
 * não escreve nada: fora de campo editável, sem Ctrl, Alt ou Cmd (que são do navegador e do
 * sistema), sem repetição de tecla segurada e sem modal aberto, que tem o foco e a tela.
 */
export function findShortcutAction(
  event: Pick<KeyboardEvent, "key" | "target" | "ctrlKey" | "metaKey" | "altKey" | "repeat" | "defaultPrevented">,
  actions: readonly QuickAction[],
  hasOpenDialog: boolean,
): QuickAction | null {
  if (event.defaultPrevented || event.repeat || hasOpenDialog) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.target instanceof Element && event.target.closest(EDITABLE_SELECTOR)) return null;

  const key = event.key.toUpperCase();

  return actions.find((action) => action.shortcut === key) ?? null;
}
