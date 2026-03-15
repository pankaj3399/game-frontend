import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface TournamentListItem {
  id: string;
  name: string;
  club: { id: string; name: string } | null;
  date: string | null;
  status: "active" | "draft" | "inactive";
  sponsor: { id: string; name: string; logoUrl: string | null; link: string | null } | null;
}

interface TournamentsResponse {
  tournaments: TournamentListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TournamentListFilters {
  status?: string;
  clubId?: string;
  page?: number;
  limit?: number;
  q?: string;
  /** 'published' | 'drafts' - organiser only; controls which tournaments are listed */
  view?: "published" | "drafts";
}

async function fetchTournaments(filters: TournamentListFilters): Promise<TournamentsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.clubId) params.set("clubId", filters.clubId);
  if (filters.view) params.set("view", filters.view);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  const url = query ? `/api/tournaments?${query}` : "/api/tournaments";
  const res = await api.get<TournamentsResponse>(url);
  return res.data;
}

export function useTournaments(filters: TournamentListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.list(filters),
    queryFn: () => fetchTournaments(filters),
    enabled,
  });
}

export function useTournamentsSuspense(filters: TournamentListFilters = {}) {
  return useSuspenseQuery({
    queryKey: queryKeys.tournament.list(filters),
    queryFn: () => fetchTournaments(filters),
  });
}
