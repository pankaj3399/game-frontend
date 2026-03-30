import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AuthContext, type AuthContextValue, type AuthUser } from "./context";

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await api.get<{ user: AuthUser | null }>("/api/auth/me");
    return res.data.user ?? null;
  } catch (err: unknown) {
    const status = (err as any)?.response?.status;
    if (status === 401 || status === 403 || status === 404) {
      return null;
    }
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
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

    await queryClient.cancelQueries({ queryKey: ["auth", "me"] });

    queryClient.setQueryData(["auth", "me"], null);

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

  const value: AuthContextValue = {
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user,
    isProfileComplete: !!(user?.alias?.trim() && user?.name?.trim()),
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
