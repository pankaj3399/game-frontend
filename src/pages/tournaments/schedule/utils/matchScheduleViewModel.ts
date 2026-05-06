import type { TournamentScheduleMatch } from "@/models/tournament/types";
import {
  deriveMatchScheduleRoundModel,
  getPreviousRoundGate,
  parseRoundQueryParam,
  resolveMatchViewSelectedRound,
} from "@/pages/tournaments/schedule/helpers/tournamentRoundWorkflow";

/** Within one round: still open → completed → historical → cancelled. */
function compareMatchesForRoundView(
  a: TournamentScheduleMatch,
  b: TournamentScheduleMatch
): number {
  const tier = (m: TournamentScheduleMatch): number => {
    if (m.status === "cancelled") return 3;
    if (m.detachedFromRound != null) return 2;
    const open =
      m.status === "scheduled" || m.status === "inProgress" || m.status === "pendingScore";
    if (open) return 0;
    return 1;
  };

  const ta = tier(a);
  const tb = tier(b);
  if (ta !== tb) return ta - tb;
  return a.slot - b.slot;
}

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
    .sort(compareMatchesForRoundView);
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
