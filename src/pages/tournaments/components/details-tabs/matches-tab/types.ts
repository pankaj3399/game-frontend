import type { TournamentMatchStatus } from "@/models/tournament/types";

export type MatchStatus = TournamentMatchStatus;

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
  cancelledCount: number;
  progressPct: number;
}
