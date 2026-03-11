import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SponsorPublic {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  link: string | null;
}

interface AllSponsorsResponse {
  sponsors: SponsorPublic[];
}

async function fetchAllSponsors(): Promise<AllSponsorsResponse> {
  const res = await api.get<AllSponsorsResponse>("/api/sponsors");
  return res.data;
}

export function useAllSponsors() {
  return useQuery({
    queryKey: ["sponsors", "all"],
    queryFn: fetchAllSponsors,
  });
}
