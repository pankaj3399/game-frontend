import type { TournamentMode, TournamentPlayMode } from "@/models/tournament/types";

export const DEFAULT_TOURNAMENT_DURATION = 30;
export const DEFAULT_TOURNAMENT_BREAK_DURATION = 5;
const DURATION_MINUTES_STEP = 5;
const TOURNAMENT_DURATION_MIN = 5;
const TOURNAMENT_DURATION_MAX = 120;

export const TOURNAMENT_MODES: TournamentMode[] = ["singleDay", "unscheduled"];

export const PLAY_MODES: Array<{ value: TournamentPlayMode; labelKey: string }> = [
  { value: "TieBreak10", labelKey: "tournaments.playModes.tieBreak10" },
  { value: "1set", labelKey: "tournaments.playModes.oneSet" },
  { value: "3setTieBreak10", labelKey: "tournaments.playModes.threeSetTieBreak10" },
  { value: "3set", labelKey: "tournaments.playModes.threeSet" },
  { value: "5set", labelKey: "tournaments.playModes.fiveSet" },
];

export const DURATION_OPTIONS: number[] = Array.from(
  {
    length:
      (TOURNAMENT_DURATION_MAX - TOURNAMENT_DURATION_MIN) /
        DURATION_MINUTES_STEP +
      1,
  },
  (_, index) => TOURNAMENT_DURATION_MIN + index * DURATION_MINUTES_STEP
);

export const BREAK_OPTIONS: Array<{ value: number; labelKey: string }> = [
  { value: 0, labelKey: "tournaments.break.min0" },
  { value: DEFAULT_TOURNAMENT_BREAK_DURATION, labelKey: "tournaments.break.min5" },
  { value: 10, labelKey: "tournaments.break.min10" },
  { value: 15, labelKey: "tournaments.break.min15" },
];
