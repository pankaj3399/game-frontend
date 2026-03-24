import { useAllClubs } from "@/pages/clubs/hooks";

interface UseClubsListDataOptions {
  page: number;
  limit: number;
  q?: string;
}

export function useClubsListData({ page, limit, q }: UseClubsListDataOptions) {
  const query = useAllClubs({ page, limit, q });

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
