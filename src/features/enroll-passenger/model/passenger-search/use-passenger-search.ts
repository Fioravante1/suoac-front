import { useCallback, useState } from "react";

import { usePagination } from "@/shared/lib";

const MIN_PASSENGER_SEARCH_LENGTH = 2;

interface UsePassengerSearchReturn {
  searchTerm: string;
  searchPage: number;
  hasSearch: boolean;
  setSearchPage: (page: number) => void;
  updateSearchTerm: (value: string) => void;
  resetSearch: () => void;
}

export function usePassengerSearch(): UsePassengerSearchReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const { page: searchPage, setPage: setSearchPage, reset: resetSearchPage } = usePagination();

  const hasSearch = searchTerm.trim().length >= MIN_PASSENGER_SEARCH_LENGTH;

  const updateSearchTerm = useCallback(
    (value: string) => {
      setSearchTerm(value);
      resetSearchPage();
    },
    [resetSearchPage],
  );

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    resetSearchPage();
  }, [resetSearchPage]);

  return { searchTerm, searchPage, hasSearch, setSearchPage, updateSearchTerm, resetSearch };
}
