import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  tournamentMatchesResponseSchema,
  type TournamentMatchesResponse,
} from "@/models/tournament/types";

async function fetchTournamentMatches(id: string): Promise<TournamentMatchesResponse> {
  const response = await api.get(`/api/tournaments/${id}/matches`);
  return tournamentMatchesResponseSchema.parse(response.data);
}

export function useTournamentMatches(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.matches(id),
    queryFn: () => {
      if (!id) {
        throw new Error("Tournament id is required");
      }
      return fetchTournamentMatches(id);
    },
    enabled: Boolean(id) && enabled,
    refetchInterval: 60_000,
  });
}
