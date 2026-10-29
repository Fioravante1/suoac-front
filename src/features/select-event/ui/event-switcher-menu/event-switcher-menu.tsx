"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarX, Check, ChevronDown, PenLine, Plus } from "lucide-react";

import { EventStatusDot } from "@/entities/event";
import { findMenuItemToFocus } from "@/shared/lib";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

import { useEventSwitcher } from "../../model";

import styles from "./event-switcher-menu.module.css";

const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';
const LOADING_ROWS = [1, 2, 3];

/** Onde o foco entra ao abrir: no evento selecionado ou, pela seta para cima, no último item. */
type OpeningFocus = "selected" | "last";

/**
 * O item que recebe o foco quando o menu abre. Enquanto a lista carrega, o primeiro item
 * seria "Criar novo evento", e Enter levaria a outra tela: o foco espera no painel e
 * desce para o evento selecionado quando a lista chega.
 */
function findOpeningFocusTarget(panel: HTMLElement, openingFocus: OpeningFocus, isListLoading: boolean): HTMLElement {
  const items = Array.from(panel.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));

  if (openingFocus === "last") return items.at(-1) ?? panel;

  const selected = panel.querySelector<HTMLElement>('[aria-checked="true"]');

  if (selected) return selected;
  if (isListLoading) return panel;

  return items.at(0) ?? panel;
}

/**
 * Seletor de evento da faixa do desktop (`SUOAC Dashboard v3.dc.html`). O botão mostra o
 * evento selecionado e abre o menu com os eventos do circuito, para trocar o evento do
 * painel inteiro, criar um novo ou editar o atual.
 *
 * Teclado do padrão de menu: Enter, Espaço e as setas abrem; as setas, Home e End andam
 * entre os itens; Enter e Espaço ativam; Esc fecha e devolve o foco ao botão; Tab fecha e
 * segue adiante.
 */
export function EventSwitcherMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openingFocus, setOpeningFocus] = useState<OpeningFocus>("selected");
  const switcher = useEventSwitcher({ isOpen });
  const menuId = useId();
  const feedbackId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { current, events, isLoadingEvents, isEventsError, isSelecting, createEventHref, editEventHref } = switcher;
  const isCurrentPending = current === undefined && switcher.isCurrentLoading;
  const isCurrentUnavailable = current === undefined && !switcher.isCurrentLoading;
  const hasNoCurrent = current === null;
  const hasListContent = !isLoadingEvents && !isEventsError;
  const hasNoEvents = hasListContent && events.length === 0;
  const hasFeedback = isEventsError || hasNoEvents;
  const hasActions = Boolean(createEventHref || editEventHref);

  // O foco entra no menu ao abrir e volta a entrar quando a lista termina de carregar,
  // para cair no evento selecionado em vez de ficar no painel.
  useEffect(() => {
    const panel = panelRef.current;
    const active = document.activeElement;
    const isOnItem = Boolean(panel?.contains(active)) && active !== panel;

    if (!isOpen || !panel || isOnItem) return;

    findOpeningFocusTarget(panel, openingFocus, isLoadingEvents).focus();
  }, [isOpen, openingFocus, isLoadingEvents, isEventsError]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function open(focus: OpeningFocus) {
    setOpeningFocus(focus);
    setIsOpen(true);
  }

  function closeAndFocusTrigger() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerClick() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    open("selected");
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    open(event.key === "ArrowUp" ? "last" : "selected");
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const active = document.activeElement;

    if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    // Link não reage ao Espaço por padrão; num menu, Espaço ativa o item como Enter.
    if (event.key === " " && active instanceof HTMLAnchorElement) {
      event.preventDefault();
      active.click();
      return;
    }

    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
    const target = findMenuItemToFocus(items, active, event.key);

    if (!target) return;

    event.preventDefault();
    target.focus();
  }

  function handleSelect(eventId: string) {
    closeAndFocusTrigger();
    switcher.selectEvent(eventId);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-busy={isSelecting}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onPointerEnter={switcher.prefetchEvents}
        onFocus={switcher.prefetchEvents}
      >
        {current && (
          <>
            <EventStatusDot variant={current.statusVariant} surface="navy" />
            <span className={styles.triggerTitle}>{current.title}</span>
            {current.period && <span className={styles.triggerPeriod}>{current.period}</span>}
          </>
        )}
        {hasNoCurrent && (
          <>
            <EventStatusDot variant="neutral" surface="navy" />
            <span className={styles.triggerTitle}>Nenhum evento ativo</span>
          </>
        )}
        {isCurrentPending && <span className={styles.triggerPeriod}>Carregando evento…</span>}
        {isCurrentUnavailable && <span className={styles.triggerTitle}>Escolha um evento</span>}
        {isSelecting && <Spinner size="small" className={styles.spinner} />}
        {!isSelecting && <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Eventos do circuito"
          aria-describedby={hasFeedback ? feedbackId : undefined}
          aria-busy={isLoadingEvents}
          tabIndex={-1}
          className={styles.panel}
          onKeyDown={handlePanelKeyDown}
        >
          <span className={styles.heading} aria-hidden="true">
            Eventos do circuito
          </span>

          <div className={styles.events}>
            {isLoadingEvents && (
              <div className={styles.loading} aria-hidden="true">
                {LOADING_ROWS.map((row) => (
                  <Skeleton key={row} className={styles.loadingRow} />
                ))}
              </div>
            )}

            {isEventsError && (
              <div className={styles.feedback}>
                <p id={feedbackId} className={styles.feedbackText}>
                  Não foi possível carregar os eventos. Verifique sua conexão e tente de novo.
                </p>
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className={styles.retry}
                  onClick={switcher.retryEvents}
                >
                  Tentar de novo
                </button>
              </div>
            )}

            {hasNoEvents && (
              <div className={styles.empty}>
                <CalendarX className={styles.emptyIcon} size={20} aria-hidden="true" />
                <div id={feedbackId} className={styles.emptyText}>
                  <p className={styles.emptyTitle}>Nenhum evento no circuito ainda.</p>
                  <p className={styles.feedbackText}>
                    {createEventHref
                      ? "Crie o primeiro evento para começar as inscrições."
                      : "Quando o circuito criar um evento, ele aparece aqui."}
                  </p>
                </div>
              </div>
            )}

            {hasListContent &&
              events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={event.isSelected}
                  tabIndex={-1}
                  className={styles.event}
                  onClick={() => handleSelect(event.id)}
                >
                  <EventStatusDot variant={event.statusVariant} />
                  <span className={styles.eventText}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventMeta}>{event.meta}</span>
                  </span>
                  {event.isSelected && <Check className={styles.check} size={16} aria-hidden="true" />}
                </button>
              ))}
          </div>

          {hasActions && <div className={styles.separator} role="separator" />}

          {createEventHref && (
            <Link
              href={createEventHref}
              role="menuitem"
              tabIndex={-1}
              className={styles.create}
              onClick={() => setIsOpen(false)}
            >
              <Plus size={16} aria-hidden="true" />
              Criar novo evento
            </Link>
          )}

          {editEventHref && (
            <Link
              href={editEventHref}
              role="menuitem"
              tabIndex={-1}
              className={styles.edit}
              onClick={() => setIsOpen(false)}
            >
              <PenLine size={16} aria-hidden="true" />
              Editar evento atual
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
