import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { z } from "zod";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  DEFAULT_TOURNAMENT_FILTERS_STATE,
  filtersReducer,
  isTournamentDistanceFilter,
  isTournamentWhenFilter,
  resolveTournamentListTabFromSearchParams,
  shapeTournamentFilters,
  type TournamentListTab,
} from "@/models/tournament";

interface UseTournamentFiltersOptions {
  isOrganiserOrAbove: boolean;
  userId?: string | null;
  isAuthLoading?: boolean;
  /** `searchParams.get("view")` — organisers: tab resolves from this on first render. */
  viewSearchParam: string | null;
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

const persistedRootSchema = z.object({
  activeTab: z.enum(["published", "drafts"]).optional(),
  updatedAt: z.preprocess(
    (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? v : 0,
    z.number().finite()
  ),
  filters: z.unknown().optional(),
});

function getStorageKey(userId: string) {
  return `${TOURNAMENT_FILTERS_STORAGE_PREFIX}${userId}`;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* SecurityError, QuotaExceededError, private mode, etc. */
  }
}

/** Plain object from JSON (not array / null). */
function asFilterRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function trimmedNonEmpty(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function parseEnumField<V extends string>(
  value: unknown,
  isMember: (s: string) => s is V
): V | undefined {
  return typeof value === "string" && isMember(value) ? value : undefined;
}

function parsePersistedFilters(filters: unknown) {
  const raw = asFilterRecord(filters);
  if (!raw) return {};
  return {
    q: trimmedNonEmpty(raw.q),
    when: parseEnumField(raw.when, isTournamentWhenFilter),
    distance: parseEnumField(raw.distance, isTournamentDistanceFilter),
    clubId: trimmedNonEmpty(raw.clubId),
  };
}

function parsePersistedState(rawValue: string) {
  try {
    const root = persistedRootSchema.safeParse(JSON.parse(rawValue));
    if (!root.success) return null;

    const { activeTab: tab, updatedAt, filters } = root.data;
    const activeTab: TournamentListTab = tab === "drafts" ? "drafts" : "published";

    return {
      activeTab,
      filters: parsePersistedFilters(filters),
      updatedAt,
    } satisfies PersistedTournamentFiltersState;
  } catch {
    return null;
  }
}

function readPersistedState(storageKey: string) {
  const storage = getLocalStorage();
  if (!storage) return null;
  const rawValue = storage.getItem(storageKey);
  if (!rawValue) return null;
  return parsePersistedState(rawValue);
}

export function useTournamentFilters({
  isOrganiserOrAbove,
  userId,
  isAuthLoading = false,
  viewSearchParam,
}: UseTournamentFiltersOptions) {
  const [state, dispatch] = useReducer(
    filtersReducer,
    DEFAULT_TOURNAMENT_FILTERS_STATE
  );

  const activeTab = useMemo(
    () =>
      resolveTournamentListTabFromSearchParams(
        isOrganiserOrAbove,
        viewSearchParam,
        state.activeTab
      ),
    [isOrganiserOrAbove, viewSearchParam, state.activeTab]
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const hydratedStorageKeyRef = useRef<string | null>(null);
  const skipNextPersistRef = useRef(false);
  const normalizedUserId = userId || ANONYMOUS_USER_STORAGE_ID;
  const storageKey = getStorageKey(normalizedUserId);

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
          activeTab,
          filters: {
            ...state.filters,
            q: debouncedQ?.trim() || undefined,
          },
        },
        isOrganiserOrAbove
      ),
    [state, activeTab, debouncedQ, isOrganiserOrAbove]
  );

  const persistedQ = state.filters.q?.trim() || undefined;

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
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    if (isAuthLoading) {
      return;
    }
    if (hydratedStorageKeyRef.current === storageKey) {
      return;
    }

    const anonymousStorageKey = getStorageKey(ANONYMOUS_USER_STORAGE_ID);
    const anonymousPersisted = readPersistedState(anonymousStorageKey);
    const userPersisted =
      normalizedUserId === ANONYMOUS_USER_STORAGE_ID
        ? null
        : readPersistedState(storageKey);

    const persisted =
      normalizedUserId !== ANONYMOUS_USER_STORAGE_ID && userPersisted && anonymousPersisted
        ? userPersisted.updatedAt >= anonymousPersisted.updatedAt
          ? userPersisted
          : anonymousPersisted
        : normalizedUserId !== ANONYMOUS_USER_STORAGE_ID
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
    if (normalizedUserId !== ANONYMOUS_USER_STORAGE_ID) {
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
        safeSetItem(storageKey, JSON.stringify(nextPayload));
      }
    }

    hydratedStorageKeyRef.current = storageKey;
  }, [isAuthLoading, isOrganiserOrAbove, normalizedUserId, storageKey]);

  /**
   * 💾 Persist to localStorage
   */
  useEffect(() => {
    const storage = getLocalStorage();
    if (!storage) return;
    if (hydratedStorageKeyRef.current !== storageKey) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const storagePayload = {
      activeTab,
      filters: {
        q: persistedQ,
        when: state.filters.when,
        distance: state.filters.distance,
        clubId: state.filters.clubId,
      },
      updatedAt: Date.now(),
    };

    safeSetItem(storageKey, JSON.stringify(storagePayload));
  }, [
    storageKey,
    activeTab,
    persistedQ,
    state.filters.when,
    state.filters.distance,
    state.filters.clubId,
  ]);

  return {
    activeTab,
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