import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  DEFAULT_TOURNAMENT_FILTERS_STATE,
  filtersReducer,
  isTournamentClubScope,
  isTournamentDistanceFilter,
  isTournamentParticipationFilter,
  isTournamentWhenFilter,
  resolveTournamentListTabFromSearchParams,
  shapeTournamentFilters,
  type TournamentFiltersState,
  type TournamentListTab,
} from "@/models/tournament";

interface UseTournamentFiltersOptions {
  isOrganiserOrAbove: boolean;
  userId?: string | null;
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
    clubScope?: string;
    participation?: string;
  };
  updatedAt: number;
}

const TOURNAMENT_FILTERS_STORAGE_PREFIX = "tournament:list:filters:";
const ANONYMOUS_USER_STORAGE_ID = "anonymous";
const QUERY_DEBOUNCE_MS = 200;

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
  const parsedDistance = parseEnumField(raw.distance, isTournamentDistanceFilter);
  const distance = parsedDistance === "over80" ? undefined : parsedDistance;
  const clubId = trimmedNonEmpty(raw.clubId);
  let clubScope = parseEnumField(raw.clubScope, isTournamentClubScope);
  if (clubId && clubScope) {
    clubScope = undefined;
  }
  return {
    q: trimmedNonEmpty(raw.q),
    when: parseEnumField(raw.when, isTournamentWhenFilter),
    distance,
    clubId,
    clubScope,
    participation: parseEnumField(raw.participation, isTournamentParticipationFilter),
  };
}

function parsePersistedState(rawValue: string) {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    const root = asFilterRecord(parsed);
    if (!root) return null;

    const tab = root.activeTab;
    const activeTab: TournamentListTab = tab === "drafts" ? "drafts" : "published";
    const updatedAt =
      typeof root.updatedAt === "number" && Number.isFinite(root.updatedAt)
        ? root.updatedAt
        : 0;

    return {
      activeTab,
      filters: parsePersistedFilters(root.filters),
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

function stateFromPersisted(
  persisted: PersistedTournamentFiltersState | null,
): TournamentFiltersState {
  if (!persisted) {
    return {
      activeTab: DEFAULT_TOURNAMENT_FILTERS_STATE.activeTab,
      filters: { ...DEFAULT_TOURNAMENT_FILTERS_STATE.filters },
    };
  }
  const filters = parsePersistedFilters(persisted.filters);
  return {
    activeTab: persisted.activeTab,
    filters: {
      ...DEFAULT_TOURNAMENT_FILTERS_STATE.filters,
      ...filters,
      when: filters.when ?? DEFAULT_TOURNAMENT_FILTERS_STATE.filters.when,
      page: 1,
    },
  };
}

/** Prefer the newer of user vs anonymous storage when both exist. */
function resolvePersistedForUser(normalizedUserId: string) {
  const anonymousStorageKey = getStorageKey(ANONYMOUS_USER_STORAGE_ID);
  const anonymousPersisted = readPersistedState(anonymousStorageKey);
  if (normalizedUserId === ANONYMOUS_USER_STORAGE_ID) {
    return { persisted: anonymousPersisted, userPersisted: null, anonymousPersisted };
  }
  const storageKey = getStorageKey(normalizedUserId);
  const userPersisted = readPersistedState(storageKey);
  const persisted =
    userPersisted && anonymousPersisted
      ? userPersisted.updatedAt >= anonymousPersisted.updatedAt
        ? userPersisted
        : anonymousPersisted
      : userPersisted ?? anonymousPersisted;
  return { persisted, userPersisted, anonymousPersisted };
}

export function useTournamentFilters({
  isOrganiserOrAbove,
  userId,
  viewSearchParam,
}: UseTournamentFiltersOptions) {
  // Sync hydrate anonymous key on first render so the list query is not gated a frame.
  const [state, dispatch] = useReducer(filtersReducer, undefined, () =>
    stateFromPersisted(readPersistedState(getStorageKey(ANONYMOUS_USER_STORAGE_ID))),
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
  const hydratedStorageKeyRef = useRef<string>(
    getStorageKey(ANONYMOUS_USER_STORAGE_ID),
  );
  const skipNextPersistRef = useRef(true);
  const normalizedUserId = userId || ANONYMOUS_USER_STORAGE_ID;
  const storageKey = getStorageKey(normalizedUserId);

  const debouncedQ = useDebouncedValue(state.filters.q, QUERY_DEBOUNCE_MS);

  const shapedFilters = useMemo(
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
      type: "SET_CLUB_FILTER",
      payload: {
        clubId: value && value.trim().length > 0 ? value : undefined,
      },
    });
  }, []);

  const setClubFilter = useCallback(
    (payload: { clubId?: string; clubScope?: "favorites" }) => {
      dispatch({ type: "SET_CLUB_FILTER", payload });
    },
    []
  );

  const setParticipationFromValue = useCallback((value: string) => {
    dispatch({
      type: "SET_PARTICIPATION",
      payload:
        value === "all"
          ? undefined
          : isTournamentParticipationFilter(value)
            ? value
            : undefined,
    });
  }, []);

  /**
   * When /auth/me resolves, merge user storage without flipping a fetch gate off.
   * Never set hydrated=false after the sync anonymous init.
   */
  useEffect(() => {
    if (hydratedStorageKeyRef.current === storageKey) return;

    const { persisted, userPersisted, anonymousPersisted } =
      resolvePersistedForUser(normalizedUserId);

    if (persisted) {
      dispatch({
        type: "HYDRATE",
        payload: {
          activeTab: isOrganiserOrAbove ? persisted.activeTab : "published",
          filters: persisted.filters,
        },
      });
      skipNextPersistRef.current = true;

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
              clubScope: persisted.filters.clubScope,
              participation: persisted.filters.participation,
            },
            updatedAt: persisted.updatedAt,
          };
          safeSetItem(storageKey, JSON.stringify(nextPayload));
        }
      }
    }

    hydratedStorageKeyRef.current = storageKey;
  }, [isOrganiserOrAbove, normalizedUserId, storageKey]);

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
        clubScope: state.filters.clubScope,
        participation: state.filters.participation,
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
    state.filters.clubScope,
    state.filters.participation,
  ]);

  return {
    activeTab,
    filters: state.filters,
    /** Always true after sync anonymous init — kept for call-site compatibility. */
    isFiltersHydrated: true as const,
    shapedFilters,
    filtersOpen,
    setFiltersOpen,
    setTab,
    setWhenFromValue,
    setDistanceFromValue,
    setClubId,
    setClubFilter,
    setParticipationFromValue,
    setQuery,
    setPage,
  };
}
