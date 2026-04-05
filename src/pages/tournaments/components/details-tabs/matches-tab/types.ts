import type { MatchStatus } from "../shared/types";

export type { MatchStatus, TournamentMatchOutcome } from "../shared/types";

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
