import type { TournamentScheduleMatch } from "@/models/tournament/types";
import {
  deriveMatchScheduleRoundModel,
  getPreviousRoundGate,
  parseRoundQueryParam,
  resolveMatchViewSelectedRound,
} from "@/pages/tournaments/schedule/helpers/tournamentRoundWorkflow";

export interface MatchSchedulePageModel {
  selectedRound: number;
  roundMatches: TournamentScheduleMatch[];
  nextRound: number;
  canCreateNextRound: boolean;
  showRoundLoadingSkeleton: boolean;
  hasReachedFinalRound: boolean;
  /** When the new-round control is disabled, which message applies (matches schedule page copy). */
  nextRoundDisabledHint: { round: number; reason: "missing" | "incomplete" } | null;
}

export function buildMatchSchedulePageModel(
  searchParams: URLSearchParams,
  allMatches: readonly TournamentScheduleMatch[],
  scheduleCurrentRound: number,
  scheduleTotalRounds: number,
  tournamentTotalRounds: number,
  isFetchingMatches: boolean
): MatchSchedulePageModel {
  const queryRound = parseRoundQueryParam(searchParams);
  const roundModel = deriveMatchScheduleRoundModel(
    allMatches,
    scheduleCurrentRound,
    tournamentTotalRounds,
    scheduleTotalRounds
  );
  const selectedRound = resolveMatchViewSelectedRound(
    queryRound,
    scheduleCurrentRound,
    roundModel.maxRoundFromMatches
  );
  const roundMatches = allMatches
    .filter((match) => match.round === selectedRound)
    .slice()
    .sort((left, right) => left.slot - right.slot);
  const nextRound = Math.max(1, roundModel.latestGeneratedRound + 1);
  const nextRoundGate = getPreviousRoundGate(nextRound, allMatches);
  const canCreateNextRound =
    !roundModel.hasReachedFinalRound && !nextRoundGate.blocked;
  const nextRoundDisabledHint =
    !roundModel.hasReachedFinalRound && nextRoundGate.blocked
      ? { round: nextRoundGate.previousRound, reason: nextRoundGate.reason }
      : null;
  const showRoundLoadingSkeleton = isFetchingMatches && roundMatches.length === 0;

  return {
    selectedRound,
    roundMatches,
    nextRound,
    canCreateNextRound,
    showRoundLoadingSkeleton,
    hasReachedFinalRound: roundModel.hasReachedFinalRound,
    nextRoundDisabledHint,
  };
}
