import { useCallback, useRef, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/api/queryKeys";
import { useRecordTournamentMatchScore } from "@/pages/tournaments/hooks";
import type {
  RecordTournamentMatchScoreResponse,
  TournamentMatchesResponse,
  TournamentScheduleMatch,
} from "@/models/tournament/types";
import { buildScorePayload, type ScoreEditorRow } from "@/pages/tournaments/schedule/utils/matchScheduleScore";

type PersistScoreResult = {
  ok: boolean;
  mutationResult?: RecordTournamentMatchScoreResponse;
  latestData?: TournamentMatchesResponse;
};

export function usePersistMatchScore({
  tournament,
  matchesQuery,
  t,
}: {
  tournament?: { id: string } | null;
  matchesQuery: UseQueryResult<TournamentMatchesResponse, unknown>;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const queryClient = useQueryClient();
  const recordScoreMutation = useRecordTournamentMatchScore();
  const [isPersisting, setIsPersisting] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [saveErrorsByMatchId, setSaveErrorsByMatchId] = useState<Record<string, string>>({});
  const inFlightRef = useRef<Promise<PersistScoreResult> | null>(null);

  const mergeMutationResultIntoMatches = useCallback(
    (
      base: TournamentMatchesResponse | null | undefined,
      mutationResult: RecordTournamentMatchScoreResponse | undefined
    ): TournamentMatchesResponse | null => {
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
    },
    []
  );

  const pickLatestMatchesData = useCallback((args: {
    refetchData?: TournamentMatchesResponse;
    mutationResult?: RecordTournamentMatchScoreResponse;
    cacheData?: TournamentMatchesResponse;
  }): TournamentMatchesResponse | undefined => {
    if (args.refetchData) return args.refetchData;
    const mergedFromMutation = mergeMutationResultIntoMatches(args.cacheData, args.mutationResult);
    if (mergedFromMutation) return mergedFromMutation;
    return args.cacheData;
  }, [mergeMutationResultIntoMatches]);

  const persistMatchScore = useCallback(
    async (match: TournamentScheduleMatch, rows: ScoreEditorRow[], trackPerMatchState: boolean): Promise<PersistScoreResult> => {
      if (inFlightRef.current) return inFlightRef.current;
      const freshMatch = matchesQuery.data?.matches.find((m) => m.id === match.id) ?? null;
      if (!freshMatch) { toast.error(t("tournaments.matchesLoadError")); return { ok: false }; }
      if (freshMatch.status === "cancelled") { toast.error(t("tournaments.matchStatusCancelled")); return { ok: false }; }

      const payload = buildScorePayload(rows, freshMatch.playMode, t);
      if (!payload.ok) { toast.error(payload.message ?? t("tournaments.scoreEditorIncomplete")); return { ok: false }; }

      const run = async (): Promise<PersistScoreResult> => {
        let mutationResult: RecordTournamentMatchScoreResponse | undefined;
        try {
          if (trackPerMatchState) {
            setSavingMatchId(freshMatch.id);
            setSaveErrorsByMatchId((prev) => {
              if (!prev[freshMatch.id]) return prev;
              const rest = { ...prev };
              delete rest[freshMatch.id];
              return rest;
            });
          }

          mutationResult = await recordScoreMutation.mutateAsync({
            tournamentId: tournament?.id ?? "",
            matchId: freshMatch.id,
            input: { playerOneScores: payload.playerOneScores, playerTwoScores: payload.playerTwoScores },
          });

          toast.success(t("tournaments.scoreEditorSaveSuccess"));

          const cacheData = queryClient.getQueryData<TournamentMatchesResponse>(
            queryKeys.tournament.matches(tournament?.id ?? "")
          );

          return {
            ok: true,
            mutationResult,
            latestData: pickLatestMatchesData({ mutationResult, cacheData: cacheData ?? matchesQuery.data }),
          };
        } catch (error: unknown) {
          const message = getErrorMessage(error) ?? t("tournaments.liveModalScoreSaveError");
          if (trackPerMatchState) setSaveErrorsByMatchId((prev) => ({ ...prev, [freshMatch.id]: message }));
          toast.error(message);
          return { ok: false };
        } finally {
          if (trackPerMatchState) setSavingMatchId((prev) => (prev === freshMatch.id ? null : prev));
        }
      };

      setIsPersisting(true);
      inFlightRef.current = run();
      try {
        return await inFlightRef.current;
      } finally {
        inFlightRef.current = null;
        setIsPersisting(false);
      }
    },
    [matchesQuery, pickLatestMatchesData, queryClient, recordScoreMutation, t, tournament]
  );

  return {
    persistMatchScore,
    isPersisting,
    savingMatchId,
    saveErrorsByMatchId,
  } as const;
}

export default usePersistMatchScore;
