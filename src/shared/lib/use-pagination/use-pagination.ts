import { useState, useCallback } from "react";

interface UsePaginationReturn {
  page: number;
  setPage: (page: number) => void;
  reset: () => void;
}

export function usePagination(initialPage = 1): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);

  const reset = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  return { page, setPage, reset };
}
