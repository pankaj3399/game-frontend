import type { TournamentMatchStatus } from "@/models/tournament/types";

export type MatchStatus = TournamentMatchStatus;

/** Pairing + status shared with results aggregation (same rules as deriveMatches). */
export interface TournamentMatchOutcome {
  playerAId: string;
  playerBId: string | null;
  status: MatchStatus;
}
