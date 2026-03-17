import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ClubSearchResult {
  id: string;
  name: string;
}

async function searchClubs(q: string): Promise<ClubSearchResult[]> {
  if (!q.trim()) return [];
  const res = await api.get<{ clubs: ClubSearchResult[] }>("/api/clubs", {
    params: { q: q.trim() },
  });
  return res.data.clubs;
}

export function useSearchClubs(searchTerm: string) {
  return useQuery({
    queryKey: ["clubs", "search", searchTerm],
    queryFn: () => searchClubs(searchTerm),
    enabled: searchTerm.trim().length > 0,
  });
}
