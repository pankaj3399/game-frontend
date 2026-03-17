import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface ClubSponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  link: string | null;
  status: "active" | "paused";
}

interface ClubSponsorsResponse {
  sponsors: ClubSponsor[];
  subscription: {
    plan: "free" | "premium";
    canManageSponsors: boolean;
  };
}

async function fetchClubSponsors(clubId: string): Promise<ClubSponsorsResponse> {
  const res = await api.get<ClubSponsorsResponse>(`/api/clubs/${clubId}/sponsors`);
  return res.data;
}

export function useClubSponsors(clubId: string | null) {
  return useQuery({
    queryKey: queryKeys.club.sponsors(clubId ?? ""),
    queryFn: () => {
      if (!clubId) {
        throw new Error("clubId is required");
      }
      return fetchClubSponsors(clubId);
    },
    enabled: !!clubId,
  });
}
