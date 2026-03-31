import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface AdminClub {
  id: string;
  name: string;
  courtCount: number;
  membersCount: number;
  eventsCount: number;
}

interface AdminClubsResponse {
  clubs: AdminClub[];
}

function coerceFiniteCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function fetchAdminClubs(): Promise<AdminClubsResponse> {
  const res = await api.get<AdminClubsResponse>("/api/user/admin-clubs");
  return {
    clubs: (res.data.clubs ?? []).map((club) => ({
      ...club,
      membersCount: coerceFiniteCount(club.membersCount),
      eventsCount: coerceFiniteCount(club.eventsCount),
    })),
  };
}

/** Shorter stale time + refetch on focus so counts stay plausible across admins/tabs. */
const ADMIN_CLUBS_STALE_MS = 60 * 1000;

export function useAdminClubs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user.adminClubs(),
    queryFn: fetchAdminClubs,
    enabled,
    staleTime: ADMIN_CLUBS_STALE_MS,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAdminClubsSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.user.adminClubs(),
    queryFn: fetchAdminClubs,
    staleTime: ADMIN_CLUBS_STALE_MS,
  });
}
