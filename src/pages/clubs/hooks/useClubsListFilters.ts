import { useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const QUERY_DEBOUNCE_MS = 200;

export type ClubListClubScope = "all" | "home" | "favorites";

/** Same km bands as tournaments (`under50` & `between50And80`). */
export type ClubListDistanceFilter = "all" | "under50" | "between50And80";

export function useClubsListFilters() {
  const [page, setPageState] = useState(DEFAULT_PAGE);
  const [query, setQuery] = useState("");
  const [clubScope, setClubScope] = useState<ClubListClubScope>("all");
  const [distance, setDistance] = useState<ClubListDistanceFilter>("all");
  const debouncedQuery = useDebouncedValue(query, QUERY_DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();
  const setPage = (nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  };

  const setQueryValue = (value: string) => {
    setQuery(value);
    setPageState(DEFAULT_PAGE);
  };

  const setAppliedFilters = (next: { clubScope: ClubListClubScope; distance: ClubListDistanceFilter }) => {
    setClubScope(next.clubScope);
    setDistance(next.distance);
    setPageState(DEFAULT_PAGE);
  };

  return {
    page,
    limit: DEFAULT_LIMIT,
    query,
    debouncedQuery: trimmedQuery,
    setPage,
    setQuery: setQueryValue,
    clubScope,
    distance,
    setAppliedFilters,
  };
}
