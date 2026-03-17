import { useState } from "react";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

export function useClubsListFilters() {
  const [page, setPageState] = useState(DEFAULT_PAGE);

  const setPage = (nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  };

  return {
    page,
    limit: DEFAULT_LIMIT,
    setPage,
  };
}
