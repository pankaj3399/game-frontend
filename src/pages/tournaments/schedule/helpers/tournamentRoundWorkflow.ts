import type { TournamentScheduleMatch } from "@/models/tournament/types";

function isRoundResolvedStatus(status: TournamentScheduleMatch["status"]): boolean {
  return status === "completed" || status === "cancelled";
}

/**
 * Parses `?round=` from the URL. Returns null when missing or invalid (< 1 or NaN).
 */
export function parseRoundQueryParam(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("round")?.trim();
  if (raw == null || raw === "") {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    return null;
  }
  return value;
}

/** Schedule input page: when the query is absent, use the latest round from the server summary. */
export function resolveScheduleInputRound(
  queryRound: number | null,
  scheduleSummaryCurrentRound: number
): number {
  if (queryRound != null) {
    return queryRound;
  }
  return Math.max(1, scheduleSummaryCurrentRound);
}

export function maxRoundFromMatches(matches: readonly { round: number }[]): number {
  if (matches.length === 0) {
    return 0;
  }
  return matches.reduce((max, match) => Math.max(max, match.round), 0);
}

function matchViewFallbackRound(scheduleCurrentRound: number, maxFromMatches: number): number {
  if (scheduleCurrentRound > 0) {
    return scheduleCurrentRound;
  }
  if (maxFromMatches > 0) {
    return maxFromMatches;
  }
  return 1;
}

/** Match schedule page: URL wins; otherwise prefer server `currentRound`, then max round in data. */
export function resolveMatchViewSelectedRound(
  queryRound: number | null,
  scheduleCurrentRound: number,
  maxFromMatches: number
): number {
  if (queryRound != null) {
    return queryRound;
  }
  return matchViewFallbackRound(scheduleCurrentRound, maxFromMatches);
}

export type PreviousRoundBlockReason = "missing" | "incomplete";

export function getPreviousRoundGate(
  targetRound: number,
  matches: readonly TournamentScheduleMatch[]
):
  | { blocked: false }
  | { blocked: true; previousRound: number; reason: PreviousRoundBlockReason } {
  if (targetRound <= 1) {
    return { blocked: false };
  }
  const previousRound = targetRound - 1;
  const previousMatches = matches.filter((match) => match.round === previousRound);
  if (previousMatches.length === 0) {
    return { blocked: true, previousRound, reason: "missing" };
  }
  if (!previousMatches.every((match) => isRoundResolvedStatus(match.status))) {
    return { blocked: true, previousRound, reason: "incomplete" };
  }
  return { blocked: false };
}

export interface MatchScheduleRoundModel {
  maxRoundFromMatches: number;
  latestGeneratedRound: number;
  configuredTotalRounds: number;
  hasReachedFinalRound: boolean;
}

/** Single pass over matches: avoids recomputing max round in multiple places. */
export function deriveMatchScheduleRoundModel(
  matches: readonly TournamentScheduleMatch[],
  scheduleCurrentRound: number,
  tournamentTotalRounds: number,
  scheduleTotalRounds: number
): MatchScheduleRoundModel {
  const peakRound = maxRoundFromMatches(matches);
  const latestGeneratedRound = Math.max(peakRound, scheduleCurrentRound);
  const configuredTotalRounds = Math.max(1, tournamentTotalRounds, scheduleTotalRounds);
  const hasReachedFinalRound = latestGeneratedRound >= configuredTotalRounds;
  return {
    maxRoundFromMatches: peakRound,
    latestGeneratedRound,
    configuredTotalRounds,
    hasReachedFinalRound,
  };
}

