import { isValid, parseISO, type Locale } from "date-fns";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { teamSideDisplayName } from "@/pages/tournaments/schedule/utils/matchTeamDisplay";
import { formatDateOrFallback } from "@/utils/date";
import { formatTimeTo12Hour } from "@/utils/time";
import type { DerivedMatch, MatchCounts, MatchStatus } from "./types";

/** True when the string is not date-only (avoids local-midnight drift from parsing a calendar date as UTC midnight). */
function dateStringHasTimeComponent(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.includes("T")) return true;
  if (trimmed.includes(":")) return true;
  if (/z$/i.test(trimmed)) return true;
  if (/[+-]\d{2}:?\d{2}$/.test(trimmed)) return true;
  if (/[+-]\d{4}$/.test(trimmed)) return true;
  return false;
}

function scheduleText(
  date: string | null,
  startTime: string | null,
  tbdLabel: string,
  locale: Locale | undefined
) {
  let effectiveDate = date;
  let time = formatTimeTo12Hour(startTime, locale?.code);

  if (!time && date && dateStringHasTimeComponent(date)) {
    const normalized = date.replace(" ", "T");
    const parsed = parseISO(normalized);
    if (isValid(parsed)) {
      const localeTag = locale?.code ?? "en-US";
      time = parsed.toLocaleTimeString(localeTag, { hour: "numeric", minute: "2-digit" });
      effectiveDate = parsed.toISOString();
    }
  }

  if (!effectiveDate) return time ?? tbdLabel;

  const dateLabel = formatDateOrFallback(effectiveDate, tbdLabel, "P", locale);
  return `${time ?? tbdLabel} (${dateLabel})`;
}

export const MATCH_STATUS_KEYS: Record<MatchStatus, string> = {
  completed: "tournaments.matchStatusCompleted",
  inProgress: "tournaments.matchStatusInProgress",
  pendingScore: "tournaments.matchStatusPendingScore",
  scheduled: "tournaments.matchStatusScheduled",
  cancelled: "tournaments.matchStatusCancelled",
};

export function statusClassName(status: MatchStatus) {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "inProgress") return "bg-blue-100 text-blue-700";
  if (status === "pendingScore") return "bg-amber-100 text-amber-800";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-gray-100 text-gray-500";
}

export function deriveMatches(
  scheduleMatches: TournamentScheduleMatch[],
  currentUserId: string | null,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: Locale | undefined,
  fallbackDate: string | null,
  fallbackStartTime: string | null
): DerivedMatch[] {
  const pairs: DerivedMatch[] = [];
  const tbdLabel = t("tournaments.scheduledTbd");

  for (const match of scheduleMatches) {
    const first = match.players[0];
    const second = match.players[1];
    const isMine =
      !!currentUserId &&
      (first?.id === currentUserId || second?.id === currentUserId);

    const scheduleLabel = scheduleText(
      match.startTime ?? fallbackDate,
      match.startTime && dateStringHasTimeComponent(match.startTime)
        ? null
        : fallbackStartTime,
      tbdLabel,
      locale
    );

    const court = match.court;
    const courtName =
      court.name?.trim() ||
      (typeof court.number === "number" && Number.isFinite(court.number)
        ? t("tournaments.courtFallback", { number: court.number })
        : "") ||
      court.id?.trim() ||
      t("tournaments.courtTBD");

    pairs.push({
      id: match.id,
      mode: match.mode ?? "singles",
      playerA: teamSideDisplayName(match, 0, t),
      playerB: teamSideDisplayName(match, 1, t),
      courtName,
      status: match.status,
      round: match.round,
      isMine,
      scheduledText: scheduleLabel,
    });
  }

  return pairs;
}

/** Round where play is still open (min among incomplete); if all finished, last round. */
export function getCurrentRound(matches: DerivedMatch[]): number {
  if (matches.length === 0) return 1;
  const active = matches.filter((m) => m.status !== "completed" && m.status !== "cancelled");
  if (active.length > 0) {
    return active.reduce((minRound, match) => Math.min(minRound, match.round), active[0].round);
  }
  return matches.reduce((maxRound, match) => Math.max(maxRound, match.round), matches[0].round);
}

export function getMatchCounts(matches: DerivedMatch[]): MatchCounts {
  let completedCount = 0;
  let inProgressCount = 0;
  let pendingScoreCount = 0;
  let scheduledCount = 0;
  let cancelledCount = 0;

  for (const match of matches) {
    if (match.status === "completed") {
      completedCount += 1;
    } else if (match.status === "inProgress") {
      inProgressCount += 1;
    } else if (match.status === "pendingScore") {
      pendingScoreCount += 1;
    } else if (match.status === "cancelled") {
      cancelledCount += 1;
    } else {
      scheduledCount += 1;
    }
  }

  const progressPct = matches.length ? Math.round((completedCount / matches.length) * 100) : 0;

  return {
    completedCount,
    inProgressCount,
    pendingScoreCount,
    scheduledCount,
    cancelledCount,
    progressPct,
  };
}
