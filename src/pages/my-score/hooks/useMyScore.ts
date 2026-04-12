import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  myScoreResponseSchema,
  type MyScoreDateRange,
  type MyScoreFilterMode,
  type MyScoreResponse,
} from "@/models/myScore/types";

interface MyScoreFilters {
  mode: MyScoreFilterMode;
  range: MyScoreDateRange;
}

async function fetchMyScore(filters: MyScoreFilters): Promise<MyScoreResponse> {
  const response = await api.get("/api/user/my-score", {
    params: {
      mode: filters.mode,
      range: filters.range,
    },
  });

  return myScoreResponseSchema.parse(response.data);
}

export function useMyScore(filters: MyScoreFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.user.myScore(filters),
    queryFn: () => fetchMyScore(filters),
    enabled,
  });
}
