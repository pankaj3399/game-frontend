import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  DEFAULT_TOURNAMENT_FILTERS_STATE,
  filtersReducer,
  isTournamentDistanceFilter,
  isTournamentWhenFilter,
  shapeTournamentFilters,
  type TournamentListTab,
} from "@/models/tournament";

interface UseTournamentFiltersOptions {
  isOrganiserOrAbove: boolean;
  userId?: string | null;
}

const TOURNAMENT_FILTERS_STORAGE_PREFIX = "tournament:list:filters:";
const QUERY_DEBOUNCE_MS = 200;

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

    const q =
      typeof filtersRaw.q === "string" && filtersRaw.q.trim().length > 0
        ? filtersRaw.q.trim()
        : undefined;

    const when =
      typeof filtersRaw.when === "string" && isTournamentWhenFilter(filtersRaw.when)
        ? filtersRaw.when
        : undefined;

    const distance =
      typeof filtersRaw.distance === "string" &&
      isTournamentDistanceFilter(filtersRaw.distance)
        ? filtersRaw.distance
        : undefined;

    const clubId =
      typeof filtersRaw.clubId === "string" &&
      filtersRaw.clubId.trim().length > 0
        ? filtersRaw.clubId
        : undefined;

    return {
      activeTab,
      filters: {
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

export function useTournamentFilters({
  isOrganiserOrAbove,
  userId,
}: UseTournamentFiltersOptions) {
  const [state, dispatch] = useReducer(
    filtersReducer,
    DEFAULT_TOURNAMENT_FILTERS_STATE
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const isHydratedRef = useRef(false);

  // ✅ Debounce only affects API layer, not state updates
  const debouncedQ = useDebouncedValue(
    state.filters.q,
    QUERY_DEBOUNCE_MS
  );

  const effectiveFilters = useCallback(
    () =>
      shapeTournamentFilters(
        {
          ...state,
          filters: {
            ...state.filters,
            q: debouncedQ,
          },
        },
        isOrganiserOrAbove
      ),
    [state, debouncedQ, isOrganiserOrAbove]
  );

  const setTab = useCallback((tab: TournamentListTab) => {
    dispatch({ type: "SET_TAB", payload: tab });
  }, []);

  /**
   * ✅ FIXED:
   * - Only dispatch SET_QUERY
   * - Pagination reset handled inside reducer
   */
  const setQuery = useCallback((value: string) => {
    const normalized = value.trim();
    const query = normalized.length > 0 ? normalized : undefined;

    dispatch({
      type: "SET_QUERY",
      payload: query,
    });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, []);

  const setWhenFromValue = useCallback((value: string) => {
    dispatch({
      type: "SET_WHEN",
      payload:
        value === "all"
          ? undefined
          : isTournamentWhenFilter(value)
          ? value
          : undefined,
    });
  }, []);

  const setDistanceFromValue = useCallback((value: string) => {
    dispatch({
      type: "SET_DISTANCE",
      payload:
        value === "all"
          ? undefined
          : isTournamentDistanceFilter(value)
          ? value
          : undefined,
    });
  }, []);

  const setClubId = useCallback((value?: string) => {
    dispatch({
      type: "SET_CLUB",
      payload:
        value && value.trim().length > 0 ? value : undefined,
    });
  }, []);

  /**
   * 🔄 Hydrate from localStorage
   */
  useEffect(() => {
    if (!userId || typeof window === "undefined") {
      isHydratedRef.current = true;
      return;
    }

    const rawValue = window.localStorage.getItem(
      getStorageKey(userId)
    );

    if (!rawValue) {
      isHydratedRef.current = true;
      return;
    }

    const persisted = parsePersistedState(rawValue);

    if (!persisted) {
      isHydratedRef.current = true;
      return;
    }

    dispatch({
      type: "HYDRATE",
      payload: {
        activeTab: isOrganiserOrAbove
          ? persisted.activeTab
          : "published",
        filters: persisted.filters,
      },
    });

    isHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * 💾 Persist to localStorage
   */
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    if (!isHydratedRef.current) return;

    const storagePayload = {
      activeTab: state.activeTab,
      filters: {
        q: state.filters.q,
        when: state.filters.when,
        distance: state.filters.distance,
        clubId: state.filters.clubId,
      },
    };

    window.localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(storagePayload)
    );
  }, [
    userId,
    state.activeTab,
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
    setWhenFromValue,
    setDistanceFromValue,
    setClubId,
    setQuery,
    setPage,
  };
}