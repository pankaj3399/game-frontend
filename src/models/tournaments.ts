// Backward-compatible re-export. Prefer importing from "@/models/tournament".
export {
  DEFAULT_TOURNAMENT_FILTERS_STATE,
  filtersReducer,
  isTournamentStatus,
  shapeTournamentFilters,
  type TournamentFiltersAction,
  type TournamentFiltersState,
  type TournamentListPageFilters,
  type TournamentListTab,
} from "@/models/tournament";
