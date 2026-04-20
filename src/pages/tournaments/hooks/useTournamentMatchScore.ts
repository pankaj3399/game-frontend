import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  recordTournamentMatchScoreInputSchema,
  recordTournamentMatchScoreResponseSchema,
  type RecordTournamentMatchScoreInput,
  type RecordTournamentMatchScoreResponse,
} from "@/models/tournament/types";

async function recordTournamentMatchScore(
  tournamentId: string,
  matchId: string,
  input: RecordTournamentMatchScoreInput
): Promise<RecordTournamentMatchScoreResponse> {
  const payload = recordTournamentMatchScoreInputSchema.parse(input);
  const response = await api.patch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/score`,
    payload
  );
  return recordTournamentMatchScoreResponseSchema.parse(response.data);
}

export function useRecordTournamentMatchScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tournamentId,
      matchId,
      input,
    }: {
      tournamentId: string;
      matchId: string;
      input: RecordTournamentMatchScoreInput;
    }) => recordTournamentMatchScore(tournamentId, matchId, input),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.liveMatch() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournament.matches(variables.tournamentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournament.detail(variables.tournamentId),
      });
    },
  });
}
