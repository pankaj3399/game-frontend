import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";
import { type AuthUser } from "@/contexts/auth";
import { useAuth } from "./useAuth";

/** Same contract as AuthContext.fetchMe — share queryKey safely. */
async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await api.get<{ user: AuthUser | null }>("/api/auth/me");
    return res.data.user ?? null;
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        return null;
      }
    }
    throw err;
  }
}

export function useCurrentUser() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const authMeKey = queryKeys.auth.me();
  const cachedUpdatedAt = queryClient.getQueryState(authMeKey)?.dataUpdatedAt;

  const query = useQuery({
    queryKey: authMeKey,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60_000,
    // Hydrate from AuthContext — stamp freshness so we don't immediately refetch.
    initialData: authUser ?? undefined,
    initialDataUpdatedAt: cachedUpdatedAt || Date.now(),
  });

  const user = query.data ?? null;
  const isProfileComplete = !!(user?.alias?.trim() && user?.name?.trim());

  return {
    user,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    dataUpdatedAt: query.dataUpdatedAt,
    isAuthenticated: !!user,
    isProfileComplete,
  };
}
