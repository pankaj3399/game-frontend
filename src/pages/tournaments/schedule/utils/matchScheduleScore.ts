import { cn } from "@/lib/utils";
import type { TournamentPlayMode, TournamentScheduleMatch } from "@/models/tournament/types";

export type ScoreWinnerSide = "one" | "two" | null;
export type MatchScoreValue = number | "wo" | null;
export type ScoreEditorSide = "playerOne" | "playerTwo";

export interface ScoreEditorRow {
  id: string;
  playerOne: string;
  playerTwo: string;
  lastEditedSide?: ScoreEditorSide | null;
}

export interface ScoreColumn {
  playerOne: number | "wo" | null;
  playerTwo: number | "wo" | null;
  winner: ScoreWinnerSide;
}

type ScoreSetRule = "normal" | "tieBreak10";

export interface ScoreSelectOption {
  value: string;
  label: string;
}

export const SCORE_SELECT_EMPTY_VALUE = "__DASH__";

/** Shown on the winning side when the opponent recorded walkover (WO). */
export const WALKOVER_WIN_DISPLAY = "W";

const NORMAL_SET_NUMERIC_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
// Keep options realistic and usable in dropdowns; very long deuce tie-breaks are
// still accepted when already present as current values.
const TIE_BREAK_LOSER_SCORE_MAX = 21;
const TIE_BREAK_NUMERIC_OPTIONS = Array.from(
  { length: TIE_BREAK_LOSER_SCORE_MAX + 1 },
  (_, index) => index
);

export function requiredSetCountForPlayMode(playMode: TournamentPlayMode): number {
  if (playMode === "5set") {
    return 5;
  }

  if (playMode === "3set" || playMode === "3setTieBreak10") {
    return 3;
  }

  return 1;
}

export function hasRecordedMatchScore(match: TournamentScheduleMatch): boolean {
  return (
    match.score.playerOneScores.length > 0 ||
    match.score.playerTwoScores.length > 0 ||
    match.status === "completed"
  );
}

function setsNeededToWin(playMode: TournamentPlayMode): number {
  if (playMode === "5set") {
    return 3;
  }
  if (playMode === "3set" || playMode === "3setTieBreak10") {
    return 2;
  }
  return 1;
}

export function scoreColumns(match: TournamentScheduleMatch): ScoreColumn[] {
  const playerOneScores = match.score.playerOneScores;
  const playerTwoScores = match.score.playerTwoScores;
  const totalColumns = Math.max(
    requiredSetCountForPlayMode(match.playMode),
    playerOneScores.length,
    playerTwoScores.length
  );

  const columns: ScoreColumn[] = [];
  for (let index = 0; index < totalColumns; index += 1) {
    const playerOne = playerOneScores[index] ?? null;
    const playerTwo = playerTwoScores[index] ?? null;

    let winner: ScoreWinnerSide = null;
    if (typeof playerOne === "number" && typeof playerTwo === "number") {
      if (playerOne > playerTwo) {
        winner = "one";
      } else if (playerTwo > playerOne) {
        winner = "two";
      }
    } else if (playerOne === "wo") {
      winner = "two";
    } else if (playerTwo === "wo") {
      winner = "one";
    }

    columns.push({ playerOne, playerTwo, winner });
  }

  return columns;
}

export function isWalkoverWinnerCell(
  value: number | "wo" | null,
  playerOne: number | "wo" | null,
  playerTwo: number | "wo" | null,
  winner: ScoreWinnerSide,
  side: "one" | "two",
): boolean {
  return value == null && winner === side && isWalkoverSet(playerOne, playerTwo);
}

export function scoreCellHasDisplayValue(
  value: number | "wo" | null,
  playerOne: number | "wo" | null,
  playerTwo: number | "wo" | null,
  winner: ScoreWinnerSide,
  side: "one" | "two",
): boolean {
  return value != null || isWalkoverWinnerCell(value, playerOne, playerTwo, winner, side);
}

export function formatScoreCellValue(
  value: number | "wo" | null,
  playerOne: number | "wo" | null = null,
  playerTwo: number | "wo" | null = null,
  winner: ScoreWinnerSide = null,
  side?: "one" | "two",
): string {
  if (value === "wo") {
    return "WO";
  }
  if (value != null) {
    return String(value);
  }
  if (
    side != null &&
    isWalkoverWinnerCell(value, playerOne, playerTwo, winner, side)
  ) {
    return WALKOVER_WIN_DISPLAY;
  }
  return "-";
}

export function scoreCellClass(
  winner: ScoreWinnerSide,
  side: "one" | "two",
  hasValue: boolean
): string {
  if (!hasValue) {
    return "border border-dashed border-border bg-muted/30 text-muted-foreground";
  }

  if (winner === side) {
    return "bg-primary text-primary-foreground shadow-sm font-bold";
  }

  return "border border-border bg-muted/50 text-foreground";
}

/** Set winner for styling while editing — only when both sides parse and form a valid finished set. */
export function winnerSideForScoreEditorSet(
  row: ScoreEditorRow,
  setIndex: number,
  playMode: TournamentPlayMode,
): ScoreWinnerSide {
  const first = parseScoreInputValue(row.playerOne);
  const second = parseScoreInputValue(row.playerTwo);
  if (first === "wo" && second !== "wo") {
    return "two";
  }
  if (second === "wo" && first !== "wo") {
    return "one";
  }
  if (first == null || second == null) {
    return null;
  }
  if (first === "wo" && second === "wo") {
    return null;
  }
  return resolveSetWinnerFromValues(first, second, scoreRuleForSet(playMode, setIndex));
}

/** Compact square score trigger — same visual language as {@link MatchCardReadOnlyRows}. */
export function scoreEditorSelectTriggerClassName(
  row: ScoreEditorRow,
  setIndex: number,
  playMode: TournamentPlayMode,
  side: "one" | "two",
): string {
  const raw = side === "one" ? row.playerOne : row.playerTwo;
  const parsed = parseScoreInputValue(raw);
  const first = parseScoreInputValue(row.playerOne);
  const second = parseScoreInputValue(row.playerTwo);
  const winner = winnerSideForScoreEditorSet(row, setIndex, playMode);
  const hasValue = scoreCellHasDisplayValue(parsed, first, second, winner, side);
  return cn(
    "h-8 w-8 min-h-8 min-w-8 max-w-8 shrink-0 justify-center gap-0 rounded-[6px] p-0 shadow-none",
    "*:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-none *:data-[slot=select-value]:justify-center *:data-[slot=select-value]:truncate *:data-[slot=select-value]:text-center",
    scoreCellClass(winner, side, hasValue),
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  );
}

function serializeScoreValue(value: MatchScoreValue | null): string {
  if (value == null) {
    return "";
  }
  if (value === "wo") {
    return "WO";
  }
  return String(value);
}

export function parseScoreInputValue(raw: string): MatchScoreValue | null {
  const normalized = raw.trim();
  if (normalized === "" || normalized === "-" || normalized === SCORE_SELECT_EMPTY_VALUE) {
    return null;
  }

  if (normalized.toLowerCase() === "wo") {
    return "wo";
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99) {
    return null;
  }

  return parsed;
}

function scoreRuleForSet(playMode: TournamentPlayMode, setIndex: number): ScoreSetRule {
  if (playMode === "TieBreak10") {
    return "tieBreak10";
  }

  if (playMode === "3setTieBreak10" && setIndex === 2) {
    return "tieBreak10";
  }

  return "normal";
}

function scoreValueSortRank(value: MatchScoreValue | null): number {
  if (value == null) {
    return -1;
  }
  if (value === "wo") {
    return 1000;
  }
  return value;
}

function uniqueScoreValues(values: Array<MatchScoreValue | null>): Array<MatchScoreValue | null> {
  const seen = new Set<string>();
  const result: Array<MatchScoreValue | null> = [];

  for (const value of values) {
    const key = value == null ? "null" : value === "wo" ? "wo" : `n:${value}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }

  return result.sort((a, b) => scoreValueSortRank(a) - scoreValueSortRank(b));
}

function constrainedOppositeScores(
  rule: ScoreSetRule,
  selectedValue: MatchScoreValue | null
): Array<MatchScoreValue | null> {
  if (selectedValue == null) {
    return ["wo"];
  }

  if (selectedValue === "wo") {
    return [null];
  }

  const candidateScores = rule === "normal" ? NORMAL_SET_NUMERIC_OPTIONS : TIE_BREAK_NUMERIC_OPTIONS;
  return candidateScores.filter((candidate) => normalizeNumericSetPair(rule, selectedValue, candidate));
}

function baseOptionsForRule(rule: ScoreSetRule): Array<MatchScoreValue | null> {
  const numbers = rule === "normal" ? NORMAL_SET_NUMERIC_OPTIONS : TIE_BREAK_NUMERIC_OPTIONS;
  return [null, ...numbers, "wo"];
}

function asSelectOption(value: MatchScoreValue | null): ScoreSelectOption {
  if (value == null) {
    return { value: SCORE_SELECT_EMPTY_VALUE, label: "-" };
  }
  if (value === "wo") {
    return { value: "WO", label: "WO" };
  }
  return { value: String(value), label: String(value) };
}

export function getScoreSelectOptions(
  row: ScoreEditorRow,
  side: ScoreEditorSide,
  playMode: TournamentPlayMode,
  setIndex: number
): ScoreSelectOption[] {
  const rule = scoreRuleForSet(playMode, setIndex);
  const oppositeSide: ScoreEditorSide = side === "playerOne" ? "playerTwo" : "playerOne";
  const currentValue = parseScoreInputValue(row[side]);

  const sourceSide = row.lastEditedSide;
  const constrainedBase =
    sourceSide != null && sourceSide === oppositeSide
      ? constrainedOppositeScores(rule, parseScoreInputValue(row[oppositeSide]))
      : baseOptionsForRule(rule);

  const options = uniqueScoreValues([...constrainedBase, currentValue]);
  return options.map(asSelectOption);
}

function normalizeNumericSetPair(
  rule: ScoreSetRule,
  left: number,
  right: number
): boolean {
  if (rule === "normal") {
    const winner = Math.max(left, right);
    const loser = Math.min(left, right);
    if (winner === 6 && loser <= 4) {
      return true;
    }
    if (winner === 7 && (loser === 5 || loser === 6)) {
      return true;
    }
    return false;
  }

  const winner = Math.max(left, right);
  const loser = Math.min(left, right);
  if (winner === 10 && loser <= 8) {
    return true;
  }
  if (winner === 11 && loser === 9) {
    return true;
  }
  if (winner >= 12 && loser >= 10 && winner - loser === 2) {
    return true;
  }
  return false;
}

export function applyScoreInputChange(
  rows: ScoreEditorRow[],
  rowId: string,
  side: ScoreEditorSide,
  value: string,
  playMode: TournamentPlayMode,
  setIndex: number
): ScoreEditorRow[] {
  const oppositeSide: ScoreEditorSide = side === "playerOne" ? "playerTwo" : "playerOne";
  const rule = scoreRuleForSet(playMode, setIndex);
  const inputValue = parseScoreInputValue(value);

  return rows.map((row) => {
    if (row.id !== rowId) {
      return row;
    }

    const currentOpposite = parseScoreInputValue(row[oppositeSide]);
    const allowedOpposite = constrainedOppositeScores(rule, inputValue);
    let nextOpposite: MatchScoreValue | null = currentOpposite;

    if (allowedOpposite.length === 1) {
      nextOpposite = allowedOpposite[0] ?? null;
    } else if (!allowedOpposite.includes(currentOpposite)) {
      nextOpposite = null;
    }

    return {
      ...row,
      [side]: serializeScoreValue(inputValue),
      [oppositeSide]: serializeScoreValue(nextOpposite),
      lastEditedSide: side,
    };
  });
}

export function createScoreEditorRowsFromPersistedScores(
  playerOneScores: MatchScoreValue[],
  playerTwoScores: MatchScoreValue[],
  playMode: TournamentPlayMode,
  layout: "schedule" | "recordScore" = "schedule",
): ScoreEditorRow[] {
  const maxRows = Math.max(playerOneScores.length, playerTwoScores.length);
  if (maxRows === 0) {
    return [];
  }

  const baseRows = Array.from({ length: maxRows }, (_, index) => ({
    id: `set-${index + 1}`,
    playerOne: serializeScoreValue(playerOneScores[index] ?? null),
    playerTwo: serializeScoreValue(playerTwoScores[index] ?? null),
    lastEditedSide: null,
  }));

  return layout === "recordScore"
    ? visibleScoreEditorRowsForRecordScore(baseRows, playMode)
    : visibleScoreEditorRows(baseRows, playMode);
}

export function createScoreEditorRows(match: TournamentScheduleMatch): ScoreEditorRow[] {
  const columnCount = Math.max(
    requiredSetCountForPlayMode(match.playMode),
    match.score.playerOneScores.length,
    match.score.playerTwoScores.length
  );

  const rows: ScoreEditorRow[] = [];
  for (let index = 0; index < columnCount; index += 1) {
    rows.push({
      id: `${match.id}-set-${index + 1}`,
      playerOne: serializeScoreValue(match.score.playerOneScores[index] ?? null),
      playerTwo: serializeScoreValue(match.score.playerTwoScores[index] ?? null),
      lastEditedSide: null,
    });
  }

  return rows;
}

function isWalkoverSet(
  first: MatchScoreValue | null,
  second: MatchScoreValue | null,
): boolean {
  return (first === "wo" && second !== "wo") || (second === "wo" && first !== "wo");
}

/** Walkover set: loser is "wo", winner side stays null (-) unless a numeric score was entered. */
function normalizeWalkoverSetScores(
  first: MatchScoreValue | null,
  second: MatchScoreValue | null,
): [MatchScoreValue, MatchScoreValue] | null {
  if (first === "wo" && second !== "wo") {
    return ["wo", typeof second === "number" ? second : null];
  }
  if (second === "wo" && first !== "wo") {
    return [typeof first === "number" ? first : null, "wo"];
  }
  return null;
}

function resolveSetWinnerFromValues(
  first: Exclude<MatchScoreValue, null>,
  second: Exclude<MatchScoreValue, null>,
  setRule: ScoreSetRule
): ScoreWinnerSide {
  if (first === "wo" && second !== "wo") {
    return "two";
  }
  if (second === "wo" && first !== "wo") {
    return "one";
  }
  if (typeof first === "number" && typeof second === "number" && normalizeNumericSetPair(setRule, first, second)) {
    return first > second ? "one" : "two";
  }
  return null;
}

export function visibleScoreEditorRows(
  rows: ScoreEditorRow[],
  playMode: TournamentPlayMode
): ScoreEditorRow[] {
  const maxSetCount = requiredSetCountForPlayMode(playMode);
  const targetSetWins = setsNeededToWin(playMode);
  let playerOneSetWins = 0;
  let playerTwoSetWins = 0;

  for (let index = 0; index < Math.min(rows.length, maxSetCount); index += 1) {
    const row = rows[index];
    if (!row) break;

    const first = parseScoreInputValue(row.playerOne.trim());
    const second = parseScoreInputValue(row.playerTwo.trim());
    if (first === "wo" && second === "wo") {
      return rows.slice(0, index + 1);
    }
    if (isWalkoverSet(first, second)) {
      return rows.slice(0, index + 1);
    }
    if (first == null || second == null) {
      return rows.slice(0, index + 1);
    }

    const setWinner = resolveSetWinnerFromValues(first, second, scoreRuleForSet(playMode, index));
    if (setWinner == null) {
      return rows.slice(0, index + 1);
    }

    if (setWinner === "one") {
      playerOneSetWins += 1;
    } else {
      playerTwoSetWins += 1;
    }

    if (playerOneSetWins >= targetSetWins || playerTwoSetWins >= targetSetWins) {
      return rows.slice(0, index + 1);
    }
  }

  return rows.slice(0, maxSetCount);
}

/** Minimum columns shown at once on record-score (mirrors schedule UX; expands as sets complete). */
const RECORD_SCORE_MIN_VISIBLE_SETS = 3;

/**
 * Progressive disclosure like {@link visibleScoreEditorRows}, but never fewer than
 * {@link RECORD_SCORE_MIN_VISIBLE_SETS} (capped by format max) so longer formats
 * do not start with a single narrow column.
 */
export function visibleScoreEditorRowsForRecordScore(
  rows: ScoreEditorRow[],
  playMode: TournamentPlayMode,
): ScoreEditorRow[] {
  const progressive = visibleScoreEditorRows(rows, playMode);
  const maxSet = requiredSetCountForPlayMode(playMode);
  if (maxSet <= 1) {
    return progressive;
  }
  const minInitial = Math.min(RECORD_SCORE_MIN_VISIBLE_SETS, maxSet);
  const targetLen = Math.min(maxSet, Math.max(progressive.length, minInitial));
  return rows.slice(0, targetLen);
}

export interface ScorePayloadBuildResult {
  ok: boolean;
  playerOneScores: MatchScoreValue[];
  playerTwoScores: MatchScoreValue[];
  message: string | null;
}

export function buildScorePayload(
  rows: ScoreEditorRow[],
  playMode: TournamentPlayMode,
  t: (key: string, options?: Record<string, unknown>) => string
): ScorePayloadBuildResult {
  const requiredSetWins = setsNeededToWin(playMode);
  const editorRows = visibleScoreEditorRows(rows, playMode);

  if (editorRows.length === 0) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorNoSets"),
    };
  }

  const playerOneScores: MatchScoreValue[] = [];
  const playerTwoScores: MatchScoreValue[] = [];
  let playerOneSetWins = 0;
  let playerTwoSetWins = 0;
  let matchCompleteByWalkover = false;

  for (let index = 0; index < editorRows.length; index += 1) {
    const row = editorRows[index];
    if (!row) {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    const first = parseScoreInputValue(row.playerOne.trim());
    const second = parseScoreInputValue(row.playerTwo.trim());
    if (first === "wo" && second === "wo") {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorBothWalkover"),
      };
    }

    const walkoverScores = normalizeWalkoverSetScores(first, second);
    if (walkoverScores) {
      const [playerOneScore, playerTwoScore] = walkoverScores;
      playerOneScores.push(playerOneScore);
      playerTwoScores.push(playerTwoScore);
      matchCompleteByWalkover = true;
      break;
    }

    if (first === null || second === null) {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    if (typeof first !== "number" || typeof second !== "number") {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    const setRule = scoreRuleForSet(playMode, index);
    if (!normalizeNumericSetPair(setRule, first, second)) {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    playerOneScores.push(first);
    playerTwoScores.push(second);

    const setWinner = resolveSetWinnerFromValues(first, second, setRule);
    if (setWinner === "one") {
      playerOneSetWins += 1;
    } else if (setWinner === "two") {
      playerTwoSetWins += 1;
    }

    if (playerOneSetWins >= requiredSetWins || playerTwoSetWins >= requiredSetWins) {
      break;
    }
  }

  if (playerOneScores.length === 0 || playerTwoScores.length === 0) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorNoSets"),
    };
  }

  if (
    !matchCompleteByWalkover &&
    playerOneSetWins < requiredSetWins &&
    playerTwoSetWins < requiredSetWins
  ) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorIncomplete"),
    };
  }

  return {
    ok: true,
    playerOneScores,
    playerTwoScores,
    message: null,
  };
}
