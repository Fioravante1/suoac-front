"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

import styles from "./action-menu.module.css";

export type ActionMenuItemVariant = "default" | "danger";

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  variant?: ActionMenuItemVariant;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  label?: string;
  menuId?: string;
}

const GAP = 8;

function applyPosition(triggerEl: HTMLButtonElement, panelEl: HTMLDivElement) {
  const trigger = triggerEl.getBoundingClientRect();
  const panel = panelEl.getBoundingClientRect();
  const fitsBelow = trigger.bottom + GAP + panel.height <= window.innerHeight;
  const top = fitsBelow ? trigger.bottom + GAP : trigger.top - panel.height - GAP;

  panelEl.style.top = `${top}px`;
  panelEl.style.left = `${trigger.right}px`;
  panelEl.style.visibility = "visible";
}

export function ActionMenu({ items, label = "Ações", menuId }: ActionMenuProps) {
  const generatedMenuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !panelRef.current) return;
    applyPosition(triggerRef.current, panelRef.current);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function reposition() {
      if (!triggerRef.current || !panelRef.current) return;
      applyPosition(triggerRef.current, panelRef.current);
    }

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (items.length === 0) return null;

  const resolvedMenuId = menuId ?? generatedMenuId;

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={resolvedMenuId}
        data-tooltip={label}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreVertical size={18} aria-hidden="true" />
      </button>

      {isOpen &&
        createPortal(
          <div ref={panelRef} id={resolvedMenuId} className={styles.panel} role="menu">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.item} ${item.variant === "danger" ? styles.itemDanger : ""}`.trim()}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onSelect();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
