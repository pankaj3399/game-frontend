import type { TournamentMode, TournamentPlayMode } from "@/models/tournament/types";

export const DEFAULT_TOURNAMENT_DURATION = "30 Min";
export const DEFAULT_TOURNAMENT_BREAK_DURATION = "5 Minutes";

export const TOURNAMENT_MODES: TournamentMode[] = ["singleDay", "unscheduled"];

export const PLAY_MODES: Array<{ value: TournamentPlayMode; labelKey: string }> = [
  { value: "TieBreak10", labelKey: "tournaments.playModes.tieBreak10" },
  { value: "1set", labelKey: "tournaments.playModes.oneSet" },
  { value: "3setTieBreak10", labelKey: "tournaments.playModes.threeSetTieBreak10" },
  { value: "3set", labelKey: "tournaments.playModes.threeSet" },
  { value: "5set", labelKey: "tournaments.playModes.fiveSet" },
];

export const DURATION_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: "15 Min", labelKey: "tournaments.duration.min15" },
  { value: DEFAULT_TOURNAMENT_DURATION, labelKey: "tournaments.duration.min30" },
  { value: "45 Min", labelKey: "tournaments.duration.min45" },
  { value: "60 Min", labelKey: "tournaments.duration.min60" },
  { value: "90 Min", labelKey: "tournaments.duration.min90" },
];

export const BREAK_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: "0 Minutes", labelKey: "tournaments.break.min0" },
  { value: DEFAULT_TOURNAMENT_BREAK_DURATION, labelKey: "tournaments.break.min5" },
  { value: "10 Minutes", labelKey: "tournaments.break.min10" },
  { value: "15 Minutes", labelKey: "tournaments.break.min15" },
];
