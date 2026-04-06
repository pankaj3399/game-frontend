import type {
  TournamentDistanceFilter,
  TournamentListFilters,
  TournamentListView,
  TournamentStatus,
  TournamentWhenFilter,
} from "./types";

export type TournamentListTab = TournamentListView;

export interface TournamentListPageFilters {
  status?: TournamentStatus;
  page: number;
  limit: number;
  q?: string;
  when?: TournamentWhenFilter;
  distance?: TournamentDistanceFilter;
  clubId?: string;
}

export interface TournamentFiltersState {
  activeTab: TournamentListTab;
  filters: TournamentListPageFilters;
}

export type TournamentFiltersAction =
  | { type: "SET_TAB"; payload: TournamentListTab }
  | { type: "SET_STATUS"; payload?: TournamentStatus }
  | { type: "SET_QUERY"; payload?: string }
  | { type: "SET_WHEN"; payload?: TournamentWhenFilter }
  | { type: "SET_DISTANCE"; payload?: TournamentDistanceFilter }
  | { type: "SET_CLUB"; payload?: string }
  | { type: "SET_PAGE"; payload: number }
  | {
      type: "HYDRATE";
      payload: {
        activeTab: TournamentListTab;
        filters: Partial<TournamentListPageFilters>;
      };
    };

export const DEFAULT_TOURNAMENT_FILTERS_STATE: TournamentFiltersState = {
  activeTab: "published",
  filters: {
    page: 1,
    limit: 10,
  },
};

export function isTournamentStatus(value: string): value is TournamentStatus {
  return value === "active" || value === "draft" || value === "inactive";
}

export function filtersReducer(
  state: TournamentFiltersState,
  action: TournamentFiltersAction
): TournamentFiltersState {
  switch (action.type) {
    case "SET_TAB":
      return {
        activeTab: action.payload,
        filters: {
          ...state.filters,
          page: 1,
          ...(action.payload === "drafts" ? { status: undefined } : {}),
        },
      };
    case "SET_STATUS":
      return {
        ...state,
        filters: {
          ...state.filters,
          page: 1,
          status: action.payload,
        },
      };
    case "SET_QUERY":
      return {
        ...state,
        filters: {
          ...state.filters,
          page: 1,
          q: action.payload,
        },
      };
    case "SET_WHEN":
      return {
        ...state,
        filters: {
          ...state.filters,
          page: 1,
          when: action.payload,
        },
      };
    case "SET_DISTANCE":
      return {
        ...state,
        filters: {
          ...state.filters,
          page: 1,
          distance: action.payload,
        },
      };
    case "SET_CLUB":
      return {
        ...state,
        filters: {
          ...state.filters,
          page: 1,
          clubId: action.payload,
        },
      };
    case "SET_PAGE":
      return {
        ...state,
        filters: {
          ...state.filters,
          page: action.payload,
        },
      };
    case "HYDRATE":
      return {
        activeTab: action.payload.activeTab,
        filters: {
          ...state.filters,
          ...action.payload.filters,
          page: 1,
        },
      };
    default:
      return state;
  }
}

export function shapeTournamentFilters(
  state: TournamentFiltersState,
  isOrganiserOrAbove: boolean
): TournamentListFilters {
  const view = isOrganiserOrAbove ? state.activeTab : undefined;
  const status = state.activeTab === "drafts" ? undefined : state.filters.status;

  return {
    page: state.filters.page,
    limit: state.filters.limit,
    q: state.filters.q,
    status,
    view,
    when: state.filters.when,
    distance: state.filters.distance,
    clubId: state.filters.clubId,
  };
}

export function getDraftActionPermissions(params: {
  activeTab: TournamentListTab;
  status: TournamentStatus;
  isOrganiserOrAbove: boolean;
}) {
  const isDraftTab = params.activeTab === "drafts";
  const isDraft = params.status === "draft";
  const isOrganiser = params.isOrganiserOrAbove;
  const canEditDraft = isDraftTab && isDraft && isOrganiser;

  return {
    isDraftTab,
    isDraft,
    isOrganiser,
    canEditDraft,
    canPublishDraft: canEditDraft,
  };
}
