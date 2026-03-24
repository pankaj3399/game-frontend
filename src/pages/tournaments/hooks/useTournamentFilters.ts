import { useReducer, useState } from "react";
import {
  DEFAULT_TOURNAMENT_FILTERS_STATE,
  filtersReducer,
  isTournamentStatus,
  shapeTournamentFilters,
  type TournamentListTab,
} from "@/models/tournament";

interface UseTournamentFiltersOptions {
  isOrganiserOrAbove: boolean;
}

export function useTournamentFilters({ isOrganiserOrAbove }: UseTournamentFiltersOptions) {
  const [state, dispatch] = useReducer(filtersReducer, DEFAULT_TOURNAMENT_FILTERS_STATE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const effectiveFilters = () => shapeTournamentFilters(state, isOrganiserOrAbove);

  const setTab = (tab: TournamentListTab) => {
    dispatch({ type: "SET_TAB", payload: tab });
  };

  const setStatusFromValue = (value: string) => {
    dispatch({
      type: "SET_STATUS",
      payload: value === "all" ? undefined : isTournamentStatus(value) ? value : undefined,
    });
  };

  const setQuery = (value: string) => {
    const normalized = value.trim();
    dispatch({
      type: "SET_QUERY",
      payload: normalized.length ? normalized : undefined,
    });
  };

  const setPage = (page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  };

  return {
    activeTab: state.activeTab,
    filters: state.filters,
    effectiveFilters,
    filtersOpen,
    setFiltersOpen,
    setTab,
    setStatusFromValue,
    setQuery,
    setPage,
  };
}
