import { useState, useCallback } from "react";

interface UseModalReturn<T> {
  isOpen: boolean;
  item: T | null;
  open: (item?: T) => void;
  close: () => void;
}

export function useModal<T = never>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  const open = useCallback((value?: T) => {
    setItem(value ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setItem(null);
  }, []);

  return { isOpen, item, open, close };
}
