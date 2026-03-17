import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

/** Minimum character length for user search to run. */
export const USER_SEARCH_MIN_LENGTH = 2;

export function isUserSearchQueryValid(query: string): boolean {
  return query.trim().length >= USER_SEARCH_MIN_LENGTH;
}

export interface SearchUserResult {
  id: string;
  email: string;
  name: string | null;
  alias: string | null;
}

interface SearchUsersResponse {
  users: SearchUserResult[];
}

async function searchUsers(q: string): Promise<SearchUsersResponse> {
  const res = await api.get<SearchUsersResponse>("/api/user/search", {
    params: { q },
  });
  return res.data;
}

export function useSearchUsers(query: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.user.search(query),
    queryFn: () => searchUsers(query),
    enabled: enabled && isUserSearchQueryValid(query),
  });
}
