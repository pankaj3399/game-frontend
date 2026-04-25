import type { TournamentPlayMode, TournamentScheduleMatch } from "@/models/tournament/types";

export type ScoreWinnerSide = "one" | "two" | null;
export type MatchScoreValue = number | "wo";
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

const NORMAL_SET_NUMERIC_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const TIE_BREAK_LOSER_SCORE_MAX = 97;
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
    } else if (playerOne === "wo" && playerTwo !== null) {
      winner = "two";
    } else if (playerTwo === "wo" && playerOne !== null) {
      winner = "one";
    }

    columns.push({ playerOne, playerTwo, winner });
  }

  return columns;
}

export function formatScoreCellValue(value: number | "wo" | null): string {
  if (value == null) {
    return "-";
  }
  if (value === "wo") {
    return "WO";
  }
  return String(value);
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

function serializeScoreValue(value: MatchScoreValue | null): string {
  if (value == null) {
    return "";
  }
  if (value === "wo") {
    return "WO";
  }
  return String(value);
}

function parseScoreInputValue(raw: string): MatchScoreValue | null {
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

  if (rule === "normal") {
    if (selectedValue <= 4) {
      return [6];
    }
    if (selectedValue === 5) {
      return [7];
    }
    if (selectedValue === 6) {
      return [0, 1, 2, 3, 4, 7];
    }
    if (selectedValue === 7) {
      return [5];
    }
    return [];
  }

  if (selectedValue <= 8) {
    return [10];
  }
  if (selectedValue === 9) {
    return [11];
  }
  const deuceWinner = selectedValue + 2;
  return deuceWinner <= 99 ? [deuceWinner] : [];
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
  const requiredRows = requiredSetCountForPlayMode(playMode);

  if (rows.length === 0 || requiredRows < 1) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorNoSets"),
    };
  }

  if (rows.length < requiredRows) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorIncomplete"),
    };
  }

  const playerOneScores: MatchScoreValue[] = [];
  const playerTwoScores: MatchScoreValue[] = [];

  for (let index = 0; index < requiredRows; index += 1) {
    const row = rows[index];
    if (!row) {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    const firstRaw = row.playerOne.trim();
    const secondRaw = row.playerTwo.trim();

    const first = parseScoreInputValue(firstRaw);
    const second = parseScoreInputValue(secondRaw);
    if (first === "wo" && second === "wo") {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorBothWalkover"),
      };
    }

    const setRule = scoreRuleForSet(playMode, index);

    if (first === null || second === null) {
      if (first === "wo" && second === null) {
        playerOneScores.push("wo");
        playerTwoScores.push(0);
        continue;
      }
      if (first === null && second === "wo") {
        playerOneScores.push(0);
        playerTwoScores.push("wo");
        continue;
      }
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    if (first === "wo" || second === "wo") {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

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
  }

  if (playerOneScores.length === 0 || playerTwoScores.length === 0) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorNoSets"),
    };
  }

  return {
    ok: true,
    playerOneScores,
    playerTwoScores,
    message: null,
  };
}
