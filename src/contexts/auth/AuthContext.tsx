import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { isAxiosError } from "axios";
import { AuthContext, type AuthContextValue, type AuthUser } from "./context";

const authMeQueryKey = queryKeys.auth.me();

async function fetchMe(): Promise<AuthUser | null> {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<AuthUser | null>({
    queryKey: authMeQueryKey,
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore network errors; still clear client state
    }

    await queryClient.cancelQueries();

    queryClient.setQueryData(authMeQueryKey, null);
  
    queryClient.removeQueries({ queryKey: queryKeys.user.all });

    // Only evict admin/auth-sensitive club-related caches. Do not remove
    // public club caches (list/detail/sponsors) which use the `club` prefix.
    queryClient.removeQueries({ queryKey: queryKeys.admin.all });
    queryClient.removeQueries({ queryKey: queryKeys.user.adminClubs(), exact: true });
  
    void queryClient.invalidateQueries({
      queryKey: authMeQueryKey,
      refetchType: "none",
    });
  };

  /**
   * Re-reads the current session from the server. Must invalidate first: a
   * successful `fetchQuery` can return cached `null` for up to `staleTime` after
   * the initial unauthenticated `/me` (e.g. after complete-signup sets the cookie).
   */
  const checkAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: authMeQueryKey });
    return queryClient.fetchQuery<AuthUser | null>({
      queryKey: authMeQueryKey,
      queryFn: fetchMe,
    });
  };

  const confirmedUnauthenticated = (() => {
    if (!error) return false;
    if (isAxiosError(error)) {
      const st = error.response?.status;
      return st === 401 || st === 403 || st === 404;
    }
    return false;
  })();

  const authCheckFailed = (() => {
    if (!error) return false;
    if (isAxiosError(error)) {
      const st = error.response?.status;
      return !(st === 401 || st === 403 || st === 404);
    }
    return true;
  })();

  const isRetryable = (() => {
    if (!error) return false;
    if (isAxiosError(error)) {
      return !error.response || (error.response.status >= 500);
    }
    return true;
  })();

  const value: AuthContextValue = {
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user && !authCheckFailed && !confirmedUnauthenticated,
    isProfileComplete: !!(user?.alias?.trim() && user?.name?.trim()),
    checkAuth,
    logout,
    confirmedUnauthenticated,
    authCheckFailed,
    authError: error ?? undefined,
    isRetryable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
