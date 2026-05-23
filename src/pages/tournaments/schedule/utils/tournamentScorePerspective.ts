import type { TournamentMatchPlayer, TournamentScheduleMatch } from "@/models/tournament/types";

export type TournamentScorePair = {
  playerOneScores: Array<number | "wo">;
  playerTwoScores: Array<number | "wo">;
};

export function teamIncludesUserId(
  team: readonly [TournamentMatchPlayer | null, TournamentMatchPlayer | null],
  userId: string | null,
): boolean {
  if (!userId) return false;
  return team.some((player) => player?.id === userId);
}

export function isUserOnSide2(
  match: Pick<TournamentScheduleMatch, "side1" | "side2">,
  userId: string | null,
): boolean {
  if (!userId) return false;
  const inSide1 = teamIncludesUserId(match.side1, userId);
  const inSide2 = teamIncludesUserId(match.side2, userId);
  return inSide2 && !inSide1;
}

/** Swap score columns (side1 ↔ side2). Symmetric — same op for canonical↔viewer. */
export function swapTournamentScorePair(scores: TournamentScorePair): TournamentScorePair {
  return {
    playerOneScores: [...scores.playerTwoScores],
    playerTwoScores: [...scores.playerOneScores],
  };
}

/**
 * Map canonical match scores (playerOne = side1, playerTwo = side2) to a grid where
 * playerOne is the viewing user's team.
 */
export function mapCanonicalScoresToViewerPerspective(
  scores: TournamentScorePair,
  match: Pick<TournamentScheduleMatch, "side1" | "side2">,
  viewerUserId: string | null,
): TournamentScorePair {
  if (!viewerUserId || !isUserOnSide2(match, viewerUserId)) {
    return scores;
  }
  return swapTournamentScorePair(scores);
}
