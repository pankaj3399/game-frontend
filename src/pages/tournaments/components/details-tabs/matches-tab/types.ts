export type MatchStatus = "completed" | "inProgress" | "scheduled";

/** Pairing + status shared with results aggregation (same rules as deriveMatches). */
export interface TournamentMatchOutcome {
  playerAId: string;
  playerBId: string | null;
  status: MatchStatus;
}

export interface DerivedMatch {
  id: string;
  playerA: string;
  playerB: string;
  courtName: string;
  status: MatchStatus;
  round: number;
  isMine: boolean;
  scheduledText: string;
}

export interface MatchCounts {
  completedCount: number;
  inProgressCount: number;
  scheduledCount: number;
  progressPct: number;
}
