"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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

export function ActionMenu({ items, label = "Ações", menuId }: ActionMenuProps) {
  const generatedMenuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
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

      {isOpen && (
        <div id={resolvedMenuId} className={styles.panel} role="menu">
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
        </div>
      )}
    </div>
  );
}
