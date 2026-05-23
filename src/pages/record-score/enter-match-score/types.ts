import type {
  TournamentPlayMode,
  TournamentScheduleMode,
} from "@/models/tournament/types";

export type AllowedPlayMode = TournamentPlayMode;
export type MatchMode = TournamentScheduleMode;

export type MatchOption = {
  id: string;
  label: string;
  startTime: string | null;
  playMode: AllowedPlayMode;
  mode: MatchMode;
  kind: "tournament" | "independent";
  tournamentId: string | null;
  matchId: string | null;
  round: number | null;
  playerOneRowLabel: string;
  playerTwoRowLabel: string;
  /** First team member photo (singles or doubles), same as schedule match cards. */
  playerOneAvatarUrl: string | null;
  playerTwoAvatarUrl: string | null;
  isLive: boolean;
  isPendingScore: boolean;
  hasRecordedScore?: boolean;
  /**
   * `canonical` — playerOne row is side1 (schedule board orientation).
   * `viewer` — playerOne row is the current user's team (record-score QR entry).
   */
  scoreRowPerspective?: "canonical" | "viewer";
};

export const INDEPENDENT_MATCH_ID = "independent-match";
