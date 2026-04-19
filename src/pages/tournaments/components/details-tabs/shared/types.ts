export type MatchStatus = "completed" | "inProgress" | "pendingScore" | "scheduled" | "cancelled";

/** Pairing + status shared with results aggregation (same rules as deriveMatches). */
export interface TournamentMatchOutcome {
  playerAId: string;
  playerBId: string | null;
  status: MatchStatus;
}
