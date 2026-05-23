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
  player:
    | { name?: string | null; alias?: string | null }
    | null
    | undefined,
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

export function resolveTournamentNameForLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  tournamentName: string | null | undefined,
): string {
  return (
    normalizeDisplayNameForLabel(tournamentName ?? "", 40) ||
    t("recordScorePage.enter.validatedMatchFallback", {
      defaultValue: "Validated match",
    })
  );
}

export function buildTournamentScopedMatchLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  tournamentName: string | null | undefined,
  detailLabel: string,
): string {
  const resolvedDetail = detailLabel.trim();
  const resolvedTournament = resolveTournamentNameForLabel(t, tournamentName);
  if (!resolvedDetail) {
    return resolvedTournament;
  }
  return `${resolvedTournament} · ${resolvedDetail}`;
}

export function buildMatchLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  match: TournamentLiveMatchItem,
) {
  const opponentTeam = formatLiveMatchTeamLabel(match.opponentTeam, t);
  const base = buildTournamentScopedMatchLabel(t, match.tournament.name, opponentTeam);
  return match.status === "inProgress"
    ? `${base} (${String(t("tournaments.liveLabel")).toLowerCase()})`
    : base;
}

export function isScorableMatchOption(option: MatchOption): boolean {
  return option.kind === "independent" || !option.hasRecordedScore;
}

function toStartTimeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? null : time;
}

function isIsoOnCurrentLocalDay(
  value: string | null | undefined,
  referenceDate: Date,
): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  return (
    parsed.getFullYear() === referenceDate.getFullYear() &&
    parsed.getMonth() === referenceDate.getMonth() &&
    parsed.getDate() === referenceDate.getDate()
  );
}

function pickEarliestByStartTime(options: MatchOption[]): MatchOption | null {
  return options.reduce<MatchOption | null>((earliest, option) => {
    if (!earliest) return option;

    const earliestTs = toStartTimeMs(earliest.startTime);
    const optionTs = toStartTimeMs(option.startTime);
    if (earliestTs == null) return option;
    if (optionTs == null) return earliest;
    return optionTs < earliestTs ? option : earliest;
  }, null);
}

/** Prefer today's earliest match, then live, pending score, next upcoming, then flexible (no start time). */
export function pickDefaultScorableTournamentOption(
  options: MatchOption[],
  referenceDate = new Date(),
): MatchOption | null {
  const scorable = options.filter(
    (option) =>
      option.kind === "tournament" &&
      option.matchId != null &&
      isScorableMatchOption(option),
  );
  if (scorable.length === 0) return null;

  const nowMs = referenceDate.getTime();
  const matchOnCurrentDay = pickEarliestByStartTime(
    scorable.filter((option) => isIsoOnCurrentLocalDay(option.startTime, referenceDate)),
  );
  const nextUpcoming = pickEarliestByStartTime(
    scorable.filter((option) => {
      const ts = toStartTimeMs(option.startTime);
      return ts != null && ts > nowMs;
    }),
  );
  const flexibleUnscheduled = scorable.find((option) => option.startTime == null);

  return (
    matchOnCurrentDay ??
    scorable.find((option) => option.isLive) ??
    scorable.find((option) => option.isPendingScore) ??
    nextUpcoming ??
    flexibleUnscheduled ??
    scorable[0] ??
    null
  );
}

/** Enrolled tournaments with no match rows yet — prefer today, then next tournament date. */
export function pickDefaultEligibleTournamentOption(
  options: MatchOption[],
  referenceDate = new Date(),
): MatchOption | null {
  const pending = options.filter(
    (option) =>
      option.kind === "tournament" &&
      option.matchId == null &&
      isScorableMatchOption(option),
  );
  if (pending.length === 0) return null;

  const onToday = pending.filter((option) =>
    isIsoOnCurrentLocalDay(option.startTime, referenceDate),
  );
  const earliestOnToday = pickEarliestByStartTime(onToday);
  if (earliestOnToday) return earliestOnToday;

  const nowMs = referenceDate.getTime();
  const nextByDate = pickEarliestByStartTime(
    pending.filter((option) => {
      const ts = toStartTimeMs(option.startTime);
      return ts != null && ts >= nowMs;
    }),
  );

  return nextByDate ?? pending[0] ?? null;
}

export const PENDING_TOURNAMENT_OPTION_PREFIX = "pending-tournament-";

export function pendingTournamentOptionId(tournamentId: string): string {
  return `${PENDING_TOURNAMENT_OPTION_PREFIX}${tournamentId}`;
}

export function isPendingTournamentOptionId(optionId: string): boolean {
  return optionId.startsWith(PENDING_TOURNAMENT_OPTION_PREFIX);
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
