import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";
import { type AuthUser } from "@/contexts/auth";
import { useAuth } from "./useAuth";

async function fetchCurrentUser() {
  const res = await api.get<{ user: AuthUser }>("/api/auth/me");
  return res.data.user;
}

export function useCurrentUser() {
  const { user: authUser } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    retry: false,
    // Hydrate from AuthContext to avoid loading flicker - we already have user from auth flow
    initialData: authUser ?? undefined,
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
