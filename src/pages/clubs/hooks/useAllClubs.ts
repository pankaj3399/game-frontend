import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import type { ClubListClubScope, ClubListDistanceFilter } from "@/pages/clubs/hooks/useClubsListFilters";

export interface ClubListItem {
  id: string;
  name: string;
  address: string;
  logoUrl: string | null;
  website: string | null;
}

export interface ClubsPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface AllClubsResponse {
  clubs: ClubListItem[];
  pagination: ClubsPagination;
}

interface UseAllClubsOptions {
  page?: number;
  limit?: number;
  q?: string;
  clubScope?: ClubListClubScope;
  distance?: ClubListDistanceFilter;
  enabled?: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

async function fetchAllClubs(
  page: number,
  limit: number,
  q: string | undefined,
  clubScope: ClubListClubScope,
  distance: ClubListDistanceFilter
): Promise<AllClubsResponse> {
  const res = await api.get<AllClubsResponse>("/api/clubs/list", {
    params: {
      page,
      limit,
      clubScope,
      distance,
      ...(q?.trim() ? { q: q.trim() } : {}),
    },
  });
  return res.data;
}

export function useAllClubs(options: UseAllClubsOptions = {}) {
  const page = options.page ?? DEFAULT_PAGE;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const q = options.q;
  const clubScope = options.clubScope ?? "all";
  const distance = options.distance ?? "all";
  const enabled = options.enabled ?? true;

  return useQuery<AllClubsResponse>({
    queryKey: queryKeys.club.list({ page, limit, q, clubScope, distance }),
    queryFn: () => fetchAllClubs(page, limit, q, clubScope, distance),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
