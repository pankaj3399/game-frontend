import { useEffect, useReducer, useState } from "react";
import {
  DEFAULT_TOURNAMENT_FILTERS_STATE,
  filtersReducer,
  isTournamentDistanceFilter,
  isTournamentStatus,
  isTournamentWhenFilter,
  shapeTournamentFilters,
  type TournamentListTab,
} from "@/models/tournament";

interface UseTournamentFiltersOptions {
  isOrganiserOrAbove: boolean;
  userId?: string | null;
}

const TOURNAMENT_FILTERS_STORAGE_PREFIX = "tournament:list:filters:";

function getStorageKey(userId: string) {
  return `${TOURNAMENT_FILTERS_STORAGE_PREFIX}${userId}`;
}

function parsePersistedState(rawValue: string) {
  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") return null;

    const activeTabRaw = parsed.activeTab;
    const activeTab: TournamentListTab =
      activeTabRaw === "drafts" ? "drafts" : "published";

    const filtersRaw = parsed.filters;
    if (!filtersRaw || typeof filtersRaw !== "object") {
      return {
        activeTab,
        filters: {},
      };
    }

    const status =
      typeof filtersRaw.status === "string" && isTournamentStatus(filtersRaw.status)
        ? filtersRaw.status
        : undefined;

    const q = typeof filtersRaw.q === "string" && filtersRaw.q.trim().length > 0
      ? filtersRaw.q.trim()
      : undefined;

    const when =
      typeof filtersRaw.when === "string" && isTournamentWhenFilter(filtersRaw.when)
        ? filtersRaw.when
        : undefined;

    const distance =
      typeof filtersRaw.distance === "string" && isTournamentDistanceFilter(filtersRaw.distance)
        ? filtersRaw.distance
        : undefined;

    const clubId = typeof filtersRaw.clubId === "string" && filtersRaw.clubId.trim().length > 0
      ? filtersRaw.clubId
      : undefined;

    return {
      activeTab,
      filters: {
        status,
        q,
        when,
        distance,
        clubId,
      },
    };
  } catch {
    return null;
  }
}

export function useTournamentFilters({ isOrganiserOrAbove, userId }: UseTournamentFiltersOptions) {
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

  const setWhenFromValue = (value: string) => {
    dispatch({
      type: "SET_WHEN",
      payload: value === "all" ? undefined : isTournamentWhenFilter(value) ? value : undefined,
    });
  };

  const setDistanceFromValue = (value: string) => {
    dispatch({
      type: "SET_DISTANCE",
      payload: value === "all" ? undefined : isTournamentDistanceFilter(value) ? value : undefined,
    });
  };

  const setClubId = (value?: string) => {
    dispatch({
      type: "SET_CLUB",
      payload: value && value.trim().length > 0 ? value : undefined,
    });
  };

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const rawValue = window.localStorage.getItem(getStorageKey(userId));
    if (!rawValue) return;

    const persisted = parsePersistedState(rawValue);
    if (!persisted) return;

    dispatch({
      type: "HYDRATE",
      payload: persisted,
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const storagePayload = {
      activeTab: state.activeTab,
      filters: {
        status: state.filters.status,
        q: state.filters.q,
        when: state.filters.when,
        distance: state.filters.distance,
        clubId: state.filters.clubId,
      },
    };
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(storagePayload));
  }, [
    userId,
    state.activeTab,
    state.filters.status,
    state.filters.q,
    state.filters.when,
    state.filters.distance,
    state.filters.clubId,
  ]);

  return {
    activeTab: state.activeTab,
    filters: state.filters,
    effectiveFilters,
    filtersOpen,
    setFiltersOpen,
    setTab,
    setStatusFromValue,
    setWhenFromValue,
    setDistanceFromValue,
    setClubId,
    setQuery,
    setPage,
  };
}
