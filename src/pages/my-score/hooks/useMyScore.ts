import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  myScoreDefaultPagination,
  myScoreResponseSchema,
  type MyScoreDateRange,
  type MyScoreFilterMode,
  type MyScoreResponse,
} from "@/models/myScore/types";
import { PAGE_SIZE } from "../constants";

interface MyScoreFilters {
  playerId?: string;
  mode: MyScoreFilterMode;
  range: MyScoreDateRange;
  page: number;
  limit: number;
}

interface UseMyScoreOptions {
  enabled?: boolean;
}

async function fetchMyScore(filters: MyScoreFilters): Promise<MyScoreResponse> {
  const params = {
    mode: filters.mode,
    range: filters.range,
    page: filters.page,
    limit: filters.limit,
  };

  const response = filters.playerId
    ? await api.get(`/api/players/${encodeURIComponent(filters.playerId)}/score`, {
        params,
      })
    : await api.get("/api/user/my-score", { params });

  const parsed = myScoreResponseSchema.parse(response.data);
  const resolvedLimit =
    parsed.pagination.limit ??
    parsed.filters.limit ??
    myScoreDefaultPagination.limit ??
    PAGE_SIZE;

  return {
    ...parsed,
    pagination: {
      ...myScoreDefaultPagination,
      ...parsed.pagination,
      limit: resolvedLimit,
    },
  };
}

export function useMyScore(filters: MyScoreFilters, options?: UseMyScoreOptions) {
  const { enabled = true } = options ?? {};
  const queryResult = useQuery({
    queryKey: queryKeys.user.myScore(filters),
    queryFn: () => fetchMyScore(filters),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    ...queryResult,
  };
}
