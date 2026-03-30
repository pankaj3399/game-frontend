import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { isAxiosError } from "axios";
import { AuthContext, type AuthContextValue, type AuthUser } from "./context";

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

  const { data: user, error, status, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
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

    queryClient.setQueryData(["auth", "me"], null);
  
    queryClient.removeQueries({ queryKey: queryKeys.user.all });
  
    queryClient.removeQueries({ queryKey: queryKeys.club.all });
  
    void queryClient.invalidateQueries({
      queryKey: ["auth", "me"],
      refetchType: "none",
    });
  };

  const checkAuth = async () =>
    queryClient.fetchQuery<AuthUser | null>({
      queryKey: ["auth", "me"],
      queryFn: fetchMe,
    });

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
