import type { TournamentMatchStatus } from "@/models/tournament/types";

type MatchScoreShape = {
  playerOneScores: Array<number | "wo" | null>;
  playerTwoScores: Array<number | "wo" | null>;
};

/** True when the match already has score data saved or is fully completed. */
export function hasPersistedGameScore(
  status: TournamentMatchStatus,
  score?: MatchScoreShape | null,
): boolean {
  if (status === "completed") {
    return true;
  }

  const playerOneScores = score?.playerOneScores ?? [];
  const playerTwoScores = score?.playerTwoScores ?? [];
  return playerOneScores.length > 0 || playerTwoScores.length > 0;
}

/** User can still enter or submit a score (not finished/cancelled and no saved score yet). */
export function isOpenForScoreEntry(
  status: TournamentMatchStatus,
  score?: MatchScoreShape | null,
): boolean {
  if (status === "completed" || status === "cancelled") {
    return false;
  }

  return !hasPersistedGameScore(status, score);
}
