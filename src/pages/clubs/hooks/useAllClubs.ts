import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface ClubListItem {
  id: string;
  name: string;
  address: string;
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
  enabled?: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

async function fetchAllClubs(
  page: number,
  limit: number,
  q?: string
): Promise<AllClubsResponse> {
  const res = await api.get<AllClubsResponse>("/api/clubs/list", {
    params: {
      page,
      limit,
      ...(q?.trim() ? { q: q.trim() } : {}),
    },
  });
  return res.data;
}

export function useAllClubs(options: UseAllClubsOptions = {}) {
  const page = options.page ?? DEFAULT_PAGE;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const q = options.q;
  const enabled = options.enabled ?? true;

  return useQuery<AllClubsResponse>({
    queryKey: queryKeys.club.list({ page, limit, q }),
    queryFn: () => fetchAllClubs(page, limit, q),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
