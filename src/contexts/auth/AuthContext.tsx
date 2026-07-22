import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clearAuthToken } from "@/lib/auth/storage";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";
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

function isUnauthStatus(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const st = error.response?.status;
  return st === 401 || st === 403 || st === 404;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<AuthUser | null>({
    queryKey: authMeQueryKey,
    queryFn: fetchMe,
    retry: false,
    // Session rarely changes; avoid /auth/me on every route remount / reconnect burst.
    staleTime: 5 * 60_000,
  });

  const logout = useCallback(async () => {
    clearAuthToken();
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore network errors; still clear client state
    }

    // Cancel only auth/user/admin observers. A blanket `cancelQueries()` waits on
    // every in-flight query (tournaments, clubs, …) and can freeze the UI on mobile.
    await Promise.all([
      queryClient.cancelQueries({ queryKey: queryKeys.auth.all }),
      queryClient.cancelQueries({ queryKey: queryKeys.user.all }),
      queryClient.cancelQueries({ queryKey: queryKeys.admin.all }),
    ]);

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
  }, [queryClient]);

  /** Re-read the current session from the server (single round-trip). */
  const checkAuth = useCallback(async () => {
    return queryClient.fetchQuery<AuthUser | null>({
      queryKey: authMeQueryKey,
      queryFn: fetchMe,
      staleTime: 0,
    });
  }, [queryClient]);

  // fetchMe maps 401/403/404 → null (success), so "logged out" is data===null,
  // not an error. Only treat HTTP unauth statuses as a secondary signal.
  const confirmedUnauthenticated =
    (!isLoading && user === null && !error) ||
    Boolean(error && isUnauthStatus(error));
  const authCheckFailed = Boolean(error && !isUnauthStatus(error));
  const isRetryable = Boolean(
    error &&
      (!isAxiosError(error) ||
        !error.response ||
        error.response.status >= 500),
  );

  const resolvedUser = user ?? null;
  const isAuthenticated = !!resolvedUser && !authCheckFailed;
  const isProfileComplete = !!(
    resolvedUser?.alias?.trim() && resolvedUser?.name?.trim()
  );

  // Stable string so consumers don't re-render on new Error object identity.
  const authErrorMessage =
    authCheckFailed && error instanceof Error
      ? error.message
      : authCheckFailed
        ? "Auth check failed"
        : undefined;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: resolvedUser,
      loading: isLoading,
      isAuthenticated,
      isProfileComplete,
      checkAuth,
      logout,
      confirmedUnauthenticated,
      authCheckFailed,
      authError: authErrorMessage,
      isRetryable,
    }),
    [
      resolvedUser,
      isLoading,
      isAuthenticated,
      isProfileComplete,
      checkAuth,
      logout,
      confirmedUnauthenticated,
      authCheckFailed,
      authErrorMessage,
      isRetryable,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
