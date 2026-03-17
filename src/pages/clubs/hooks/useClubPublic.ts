import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CourtGroup {
  placement: "outdoor" | "indoor";
  count: number;
  surface: string;
}

export interface ClubSponsorPublic {
  id: string;
  name: string;
  logoUrl: string | null;
  link: string | null;
}

export interface ClubPublic {
  id: string;
  name: string;
  description: string | null;
  address: string;
  website: string | null;
  bookingSystemUrl: string | null;
  courtCount: number;
  courts: CourtGroup[];
  sponsors: ClubSponsorPublic[];
}

interface ClubPublicResponse {
  club: ClubPublic;
}

async function fetchClubPublic(clubId: string): Promise<ClubPublic> {
  const res = await api.get<ClubPublicResponse>(`/api/clubs/public/${clubId}`);
  return res.data.club;
}

export function useClubPublic(clubId: string | undefined) {
  return useQuery({
    queryKey: ["clubs", "public", clubId],
    queryFn: () => {
      if (!clubId) {
        throw new Error("clubId is required");
      }
      return fetchClubPublic(clubId);
    },
    enabled: !!clubId,
  });
}
