import type {
  TournamentPlayMode,
  TournamentScheduleMode,
} from "@/models/tournament/types";

export type AllowedPlayMode = TournamentPlayMode;
export type MatchMode = TournamentScheduleMode;

export type MatchOption = {
  id: string;
  label: string;
  playMode: AllowedPlayMode;
  mode: MatchMode;
  kind: "tournament" | "independent";
  tournamentId: string | null;
  matchId: string | null;
  round: number | null;
  playerOneRowLabel: string;
  playerTwoRowLabel: string;
  isLive: boolean;
  isPendingScore: boolean;
};

export const INDEPENDENT_MATCH_ID = "independent-match";
