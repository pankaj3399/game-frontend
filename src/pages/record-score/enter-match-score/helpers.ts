import type { ScoreEditorRow } from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import {
  SCORE_SELECT_EMPTY_VALUE,
  requiredSetCountForPlayMode,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import type { TournamentLiveMatchItem } from "@/models/tournament/types";
import type { AllowedPlayMode } from "./types";

export function createRowsForPlayMode(playMode: AllowedPlayMode): ScoreEditorRow[] {
  const setCount = requiredSetCountForPlayMode(playMode);
  return Array.from({ length: setCount }, (_, index) => ({
    id: `set-${index + 1}`,
    playerOne: "",
    playerTwo: "",
    lastEditedSide: null,
  }));
}

export function asSelectValue(value: string): string {
  const normalized = value.trim();
  if (!normalized) return SCORE_SELECT_EMPTY_VALUE;
  return normalized.toUpperCase() === "WO" ? "WO" : normalized;
}

export function scoreValueToInput(value: number | "wo"): string {
  return typeof value === "number" ? String(value) : "WO";
}

export function getScorePickerLabel(
  value: string,
  setIndex: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  return value === SCORE_SELECT_EMPTY_VALUE
    ? t("recordScorePage.enter.setPlaceholder", { set: setIndex + 1 })
    : value;
}

export function playerDisplayName(
  player: { name: string | null; alias: string | null } | null | undefined,
  fallback: string,
) {
  const hasName = player?.name?.trim();
  const hasAlias = player?.alias?.trim();
  return hasName ? hasName : hasAlias ? hasAlias : fallback;
}

export function buildMatchLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  match: TournamentLiveMatchItem,
) {
  const opponentTeam = match.opponentTeam
    .map((player, index) =>
      playerDisplayName(
        player,
        t("tournaments.playerFallback", { index: index + 1 }),
      ),
    )
    .join(" / ");

  const base = `${match.tournament.name} · ${opponentTeam || t("tournaments.playerFallback")}`;
  return match.status === "inProgress"
    ? `${base} (${String(t("tournaments.liveLabel")).toLowerCase()})`
    : base;
}

export function formatExpiry(
  expiresAtIso: string | null,
  locale: string,
): string | null {
  if (!expiresAtIso) return null;
  const parsed = new Date(expiresAtIso);
  if (Number.isNaN(parsed.getTime())) return expiresAtIso;

  return new Intl.DateTimeFormat(locale || "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
