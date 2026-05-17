import { useAllClubs } from "@/pages/clubs/hooks";
import type { ClubListClubScope, ClubListDistanceFilter } from "@/pages/clubs/hooks/useClubsListFilters";

interface UseClubsListDataOptions {
  page: number;
  limit: number;
  q?: string;
  clubScope: ClubListClubScope;
  distance: ClubListDistanceFilter;
}

export function useClubsListData({ page, limit, q, clubScope, distance }: UseClubsListDataOptions) {
  const query = useAllClubs({ page, limit, q, clubScope, distance });

  const clubs = query.isError ? [] : (query.data?.clubs ?? []);
  const pagination = query.data?.pagination ?? {
    page,
    limit,
    totalCount: 0,
    totalPages: 1,
  };

  return {
    ...query,
    clubs,
    pagination,
  };
}
