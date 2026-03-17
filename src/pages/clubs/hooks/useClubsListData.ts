import { useAllClubs } from "@/pages/clubs/hooks";

interface UseClubsListDataOptions {
  page: number;
  limit: number;
}

export function useClubsListData({ page, limit }: UseClubsListDataOptions) {
  const query = useAllClubs({ page, limit });

  const clubs = query.data?.clubs ?? [];
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
