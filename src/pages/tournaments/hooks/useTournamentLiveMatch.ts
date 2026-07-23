import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  tournamentLiveMatchResponseSchema,
  type TournamentLiveMatchResponse,
} from "@/models/tournament/types";

async function fetchTournamentLiveMatch(): Promise<TournamentLiveMatchResponse> {
  const response = await api.get("/api/tournaments/live-match");
  return tournamentLiveMatchResponseSchema.parse(response.data);
}

export function useTournamentLiveMatch(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.liveMatch(),
    queryFn: fetchTournamentLiveMatch,
    enabled,
    // Poll only while subscribed and enabled; guests / suppressed routes stay off.
    refetchInterval: enabled ? 30_000 : false,
    retry: false,
  });
}
