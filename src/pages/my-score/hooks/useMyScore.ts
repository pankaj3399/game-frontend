import { useQuery } from "@tanstack/react-query";
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
  mode: MyScoreFilterMode;
  range: MyScoreDateRange;
  page: number;
  limit: number;
}

interface UseMyScoreOptions {
  enabled?: boolean;
  onSuccess?: (data: MyScoreResponse) => void;
}

async function fetchMyScore(filters: MyScoreFilters): Promise<MyScoreResponse> {
  const response = await api.get("/api/user/my-score", {
    params: {
      mode: filters.mode,
      range: filters.range,
      page: filters.page,
      limit: filters.limit,
    },
  });

  const parsed = myScoreResponseSchema.parse(response.data);
  return {
    ...parsed,
    pagination: {
      ...myScoreDefaultPagination,
      ...parsed.pagination,
      limit: PAGE_SIZE,
    },
  };
}

export function useMyScore(filters: MyScoreFilters, options?: UseMyScoreOptions) {
  const { enabled = true, onSuccess } = options ?? {};
  const queryResult = useQuery({
    queryKey: queryKeys.user.myScore(filters),
    queryFn: async () => {
      const data = await fetchMyScore(filters);
      onSuccess?.(data);
      return data;
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });

  return {
    ...queryResult,
    isPlaceholderData: queryResult.isPlaceholderData,
  };
}
