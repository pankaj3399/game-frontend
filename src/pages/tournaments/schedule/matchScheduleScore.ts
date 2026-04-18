import type { TournamentScheduleMatch } from "@/models/tournament/types";

export type ScoreWinnerSide = "one" | "two" | null;
export type MatchScoreValue = number | "wo";

export interface ScoreEditorRow {
  id: string;
  playerOne: string;
  playerTwo: string;
}

export interface ScoreColumn {
  playerOne: number | "wo" | null;
  playerTwo: number | "wo" | null;
  winner: ScoreWinnerSide;
}

export function scoreColumns(match: TournamentScheduleMatch): ScoreColumn[] {
  const playerOneScores = match.score.playerOneScores;
  const playerTwoScores = match.score.playerTwoScores;
  const totalColumns = Math.max(3, playerOneScores.length, playerTwoScores.length);

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
    return "border border-dashed border-[#010a04]/20 bg-[#f8fbfa] text-[#9aa6a0]";
  }

  if (winner === side) {
    return "bg-gradient-to-b from-[#0d7a2f] to-[#076126] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]";
  }

  return "border border-[#010a04]/[0.16] bg-[#f2f7f4] text-[#010a04]";
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
  if (normalized === "") {
    return null;
  }

  if (normalized.toLowerCase() === "wo") {
    return "wo";
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function createScoreEditorRows(match: TournamentScheduleMatch): ScoreEditorRow[] {
  const columnCount = Math.max(
    3,
    match.score.playerOneScores.length,
    match.score.playerTwoScores.length
  );

  const rows: ScoreEditorRow[] = [];
  for (let index = 0; index < columnCount; index += 1) {
    rows.push({
      id: `${match.id}-set-${index + 1}`,
      playerOne: serializeScoreValue(match.score.playerOneScores[index] ?? null),
      playerTwo: serializeScoreValue(match.score.playerTwoScores[index] ?? null),
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
  t: (key: string, options?: Record<string, unknown>) => string
): ScorePayloadBuildResult {
  if (rows.length === 0) {
    return {
      ok: false,
      playerOneScores: [],
      playerTwoScores: [],
      message: t("tournaments.scoreEditorNoSets"),
    };
  }

  const playerOneScores: MatchScoreValue[] = [];
  const playerTwoScores: MatchScoreValue[] = [];

  for (const row of rows) {
    const firstRaw = row.playerOne.trim();
    const secondRaw = row.playerTwo.trim();
    const rowCompletelyEmpty = firstRaw === "" && secondRaw === "";
    if (rowCompletelyEmpty) {
      continue;
    }

    const first = parseScoreInputValue(firstRaw);
    const second = parseScoreInputValue(secondRaw);
    if (first == null || second == null) {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorIncomplete"),
      };
    }

    if (first === "wo" && second === "wo") {
      return {
        ok: false,
        playerOneScores: [],
        playerTwoScores: [],
        message: t("tournaments.scoreEditorBothWalkover"),
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
