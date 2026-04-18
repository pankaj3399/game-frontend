import type { TournamentScheduleMatch } from "@/models/tournament/types";
import {
  canCreateNextScheduleRound,
  deriveMatchScheduleRoundModel,
  parseRoundQueryParam,
  resolveMatchViewSelectedRound,
} from "@/pages/tournaments/schedule/tournamentRoundWorkflow";

export interface MatchSchedulePageModel {
  selectedRound: number;
  roundMatches: TournamentScheduleMatch[];
  nextRound: number;
  previousRoundBeforeNext: number;
  canCreateNextRound: boolean;
  showRoundLoadingSkeleton: boolean;
  hasReachedFinalRound: boolean;
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
  const canCreateNextRound = canCreateNextScheduleRound(
    roundModel.hasReachedFinalRound,
    nextRound,
    allMatches
  );
  const showRoundLoadingSkeleton = isFetchingMatches && roundMatches.length === 0;

  return {
    selectedRound,
    roundMatches,
    nextRound,
    previousRoundBeforeNext: nextRound - 1,
    canCreateNextRound,
    showRoundLoadingSkeleton,
    hasReachedFinalRound: roundModel.hasReachedFinalRound,
  };
}
