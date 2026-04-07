import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { mapBackendTournamentDetail } from "./mappers";
import {
  backendTournamentDetailResponseSchema,
  tournamentDetailResponseSchema,
  type TournamentDetailResponse,
} from "@/models/tournament/types";

async function fetchTournamentById(id: string): Promise<TournamentDetailResponse> {
  const res = await api.get(`/api/tournaments/${id}`);
  const parsed = backendTournamentDetailResponseSchema.parse(res.data);
  return tournamentDetailResponseSchema.parse({
    tournament: mapBackendTournamentDetail(parsed.tournament),
  });
}

export function useTournamentById(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.detail(id),
    queryFn: () => {
      if (!id) {
        throw new Error("Tournament id is required");
      }
      return fetchTournamentById(id);
    },
    enabled: !!id && enabled,
  });
}
