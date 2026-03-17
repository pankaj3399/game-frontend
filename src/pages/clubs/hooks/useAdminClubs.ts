import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface AdminClub {
  id: string;
  name: string;
  courtCount: number;
}

interface AdminClubsResponse {
  clubs: AdminClub[];
}

async function fetchAdminClubs(): Promise<AdminClubsResponse> {
  const res = await api.get<AdminClubsResponse>("/api/user/admin-clubs");
  return res.data;
}

export function useAdminClubs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user.adminClubs(),
    queryFn: fetchAdminClubs,
    enabled,
  });
}

export function useAdminClubsSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.user.adminClubs(),
    queryFn: fetchAdminClubs,
  });
}
