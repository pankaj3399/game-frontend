import type {
  RecordTournamentMatchScoreResponse,
  TournamentMatchesResponse,
  TournamentScheduleMatch,
} from "@/models/tournament/types";

export function mergeMutationResultIntoMatches(
  base: TournamentMatchesResponse | null | undefined,
  mutationResult: RecordTournamentMatchScoreResponse | undefined
): TournamentMatchesResponse | null {
  if (!base || !mutationResult) return base ?? null;
  return {
    ...base,
    matches: base.matches.map((match) =>
      match.id === mutationResult.match.id
        ? ({
            ...match,
            status: mutationResult.match.status,
          } as TournamentScheduleMatch)
        : match
    ),
  };
}

export function pickLatestMatchesData(args: {
  refetchData?: TournamentMatchesResponse;
  mutationResult?: RecordTournamentMatchScoreResponse;
  cacheData?: TournamentMatchesResponse;
}): TournamentMatchesResponse | undefined {
  if (args.refetchData) return args.refetchData;
  const mergedFromMutation = mergeMutationResultIntoMatches(args.cacheData, args.mutationResult);
  if (mergedFromMutation) return mergedFromMutation;
  return args.cacheData;
}
