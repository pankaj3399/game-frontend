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
  isAuthLoading?: boolean;
}

interface PersistedTournamentFiltersState {
  activeTab: TournamentListTab;
  filters: {
    q?: string;
    when?: string;
    distance?: string;
    clubId?: string;
  };
  updatedAt: number;
}

const TOURNAMENT_FILTERS_STORAGE_PREFIX = "tournament:list:filters:";
const ANONYMOUS_USER_STORAGE_ID = "anonymous";
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

    const updatedAt =
      typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : 0;

    const filtersRaw = parsed.filters;
    if (!filtersRaw || typeof filtersRaw !== "object") {
      return {
        activeTab,
        filters: {},
        updatedAt,
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
      updatedAt,
    } satisfies PersistedTournamentFiltersState;
  } catch {
    return null;
  }
}

function readPersistedState(storageKey: string) {
  if (typeof window === "undefined") return null;
  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) return null;
  return parsePersistedState(rawValue);
}

export function useTournamentFilters({
  isOrganiserOrAbove,
  userId,
  isAuthLoading = false,
}: UseTournamentFiltersOptions) {
  const [state, dispatch] = useReducer(
    filtersReducer,
    DEFAULT_TOURNAMENT_FILTERS_STATE
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const hydratedStorageKeyRef = useRef<string | null>(null);
  const skipNextPersistRef = useRef(false);
  const storageKey = getStorageKey(userId ?? ANONYMOUS_USER_STORAGE_ID);

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
            q:
              typeof debouncedQ === "string" && debouncedQ.trim().length > 0
                ? debouncedQ.trim()
                : undefined,
          },
        },
        isOrganiserOrAbove
      ),
    [state, debouncedQ, isOrganiserOrAbove]
  );

  const persistedQ =
    typeof state.filters.q === "string" && state.filters.q.trim().length > 0
      ? state.filters.q.trim()
      : undefined;

  const setTab = useCallback((tab: TournamentListTab) => {
    dispatch({ type: "SET_TAB", payload: tab });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, []);

  const setQuery = useCallback((value: string) => {
    dispatch({
      type: "SET_QUERY",
      payload: value.length > 0 ? value : undefined,
    });
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
    if (typeof window === "undefined") {
      return;
    }
    if (isAuthLoading) {
      return;
    }

    const anonymousStorageKey = getStorageKey(ANONYMOUS_USER_STORAGE_ID);
    const anonymousPersisted = readPersistedState(anonymousStorageKey);
    const userPersisted = userId ? readPersistedState(storageKey) : null;

    const persisted =
      userId && userPersisted && anonymousPersisted
        ? userPersisted.updatedAt >= anonymousPersisted.updatedAt
          ? userPersisted
          : anonymousPersisted
        : userId
          ? userPersisted ?? anonymousPersisted
          : anonymousPersisted;

    if (!persisted) {
      dispatch({ type: "RESET" });
      hydratedStorageKeyRef.current = storageKey;
      skipNextPersistRef.current = true;
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
    skipNextPersistRef.current = true;

    // Ensure logged-in key reflects latest state when fallback/anonymous was newer.
    if (userId) {
      const shouldSyncToUserKey =
        !userPersisted ||
        (anonymousPersisted != null &&
          anonymousPersisted.updatedAt > userPersisted.updatedAt);

      if (shouldSyncToUserKey) {
        const nextPayload: PersistedTournamentFiltersState = {
          activeTab: persisted.activeTab,
          filters: {
            q: persisted.filters.q,
            when: persisted.filters.when,
            distance: persisted.filters.distance,
            clubId: persisted.filters.clubId,
          },
          updatedAt: persisted.updatedAt,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(nextPayload));
      }
    }

    hydratedStorageKeyRef.current = storageKey;
  }, [isAuthLoading, isOrganiserOrAbove, storageKey, userId]);

  /**
   * 💾 Persist to localStorage
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hydratedStorageKeyRef.current !== storageKey) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const storagePayload = {
      activeTab: state.activeTab,
      filters: {
        q: persistedQ,
        when: state.filters.when,
        distance: state.filters.distance,
        clubId: state.filters.clubId,
      },
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(storagePayload));
  }, [
    storageKey,
    state.activeTab,
    persistedQ,
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