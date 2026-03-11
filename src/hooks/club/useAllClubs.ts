import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ClubListItem {
  id: string;
  name: string;
  address: string;
  website: string | null;
}

interface AllClubsResponse {
  clubs: ClubListItem[];
}

async function fetchAllClubs(): Promise<ClubListItem[]> {
  const res = await api.get<AllClubsResponse>("/api/clubs/list");
  return res.data.clubs;
}

export function useAllClubs() {
  return useQuery({
    queryKey: ["clubs", "all"],
    queryFn: fetchAllClubs,
  });
}
