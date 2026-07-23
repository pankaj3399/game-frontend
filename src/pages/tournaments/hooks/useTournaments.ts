import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  TournamentListFilters,
  TournamentsResponse,
} from "@/models/tournament/types";

async function fetchTournaments(filters: TournamentListFilters): Promise<TournamentsResponse> {
  const params = new URLSearchParams();
  if (filters.view) params.set("view", filters.view);
  if (filters.when) params.set("when", filters.when);
  if (filters.distance) params.set("distance", filters.distance);
  if (filters.clubScope) params.set("clubScope", filters.clubScope);
  else if (filters.clubId) params.set("club", filters.clubId);
  if (filters.participation) params.set("participation", filters.participation);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  const url = query ? `/api/tournaments?${query}` : "/api/tournaments";
  const res = await api.get(url);
  // List path: trust the API contract. Zod parse pulled the full schema graph into the critical chunk.
  return res.data as TournamentsResponse;
}

export function useTournaments(filters: TournamentListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.list(filters),
    queryFn: () => fetchTournaments(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useTournamentsSuspense(filters: TournamentListFilters = {}) {
  return useSuspenseQuery({
    queryKey: queryKeys.tournament.list(filters),
    queryFn: () => fetchTournaments(filters),
  });
}
