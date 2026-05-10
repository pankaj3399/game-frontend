import type { ScoreEditorRow } from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import {
  SCORE_SELECT_EMPTY_VALUE,
  requiredSetCountForPlayMode,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import type {
  TournamentLiveMatchItem,
  TournamentMatchPlayer,
} from "@/models/tournament/types";
import type { AllowedPlayMode, MatchOption } from "./types";

const PLAY_MODE_I18N_KEYS: Record<AllowedPlayMode, string> = {
  TieBreak10: "tournaments.playModes.tieBreak10",
  "1set": "tournaments.playModes.oneSet",
  "3setTieBreak10": "tournaments.playModes.threeSetTieBreak10",
  "3set": "tournaments.playModes.threeSet",
  "5set": "tournaments.playModes.fiveSet",
};

export function playModeTranslationKey(playMode: AllowedPlayMode): string {
  return PLAY_MODE_I18N_KEYS[playMode];
}

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
  truncate: boolean = true,
) {
  const hasName = normalizeDisplayName(player?.name);
  const hasAlias = normalizeDisplayName(player?.alias);
  const displayName = hasName ? hasName : hasAlias ? hasAlias : fallback;
  
  if (truncate && displayName !== fallback) {
    return normalizeDisplayNameForLabel(displayName, 30);
  }
  return displayName;
}

export function normalizeDisplayName(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeDisplayNameForLabel(
  value: string | null | undefined,
  maxLength: number = 50,
): string {
  const normalized = normalizeDisplayName(value);
  return normalized.length > maxLength
    ? `${normalized.substring(0, maxLength)}…`
    : normalized;
}

/** Single-line label for a live-match team row (singles or doubles). */
export function formatLiveMatchTeamLabel(
  team: TournamentMatchPlayer[],
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const formatted = team
    .map((player, index) =>
      playerDisplayName(
        player,
        t("tournaments.playerFallback", { index: index + 1 }),
      ),
    )
    .filter(Boolean)
    .join(" / ");

  return formatted.trim() ? formatted : t("tournaments.opponentUnknown");
}

export function matchRoundDisplayLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  option: Pick<MatchOption, "kind" | "round">,
): string {
  if (option.kind === "independent") {
    return t("recordScorePage.enter.independentMatch");
  }

  return typeof option.round === "number" && Number.isFinite(option.round)
    ? t("tournaments.roundNumber", { round: option.round })
    : t("tournaments.liveModalRoundPending");
}

export function buildMatchLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  match: TournamentLiveMatchItem,
) {
  const opponentTeam = formatLiveMatchTeamLabel(match.opponentTeam, t);

  const tournamentName =
    normalizeDisplayNameForLabel(match.tournament.name, 40) ||
    t("recordScorePage.enter.validatedMatchFallback", {
      defaultValue: "Validated match",
    });
  const base = `${tournamentName} · ${opponentTeam}`;
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
