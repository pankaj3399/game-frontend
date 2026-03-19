import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

/** Minimum character length for user search to run. */
export const USER_SEARCH_MIN_LENGTH = 2;
const USER_SEARCH_DEBOUNCE_MS = 300;

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
    params: { q: q.trim() },
  });
  return res.data;
}

export function useSearchUsers(query: string, enabled: boolean) {
  const debouncedQuery = useDebouncedValue(query, USER_SEARCH_DEBOUNCE_MS);

  return useQuery({
    queryKey: queryKeys.user.search(debouncedQuery.trim()),
    queryFn: () => searchUsers(debouncedQuery),
    enabled: enabled && isUserSearchQueryValid(debouncedQuery),
  });
}
