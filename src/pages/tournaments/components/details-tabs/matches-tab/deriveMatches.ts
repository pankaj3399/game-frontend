import type { Locale } from "date-fns";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { formatDateOrFallback } from "@/utils/date";
import { formatTimeTo12Hour } from "@/utils/time";
import type { DerivedMatch, MatchCounts, MatchStatus } from "./types";

function participantName(name: string | null, alias: string | null, fallback: string) {
  return name || alias || fallback;
}

function scheduleText(
  date: string | null,
  startTime: string | null,
  tbdLabel: string,
  locale: Locale | undefined
) {
  let effectiveDate = date;
  let time = formatTimeTo12Hour(startTime);

  if (!time && date) {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      const hours = parsed.getHours();
      const minutes = String(parsed.getMinutes()).padStart(2, "0");
      const suffix = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;
      time = `${displayHour}:${minutes} ${suffix}`;
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
  scheduled: "tournaments.matchStatusScheduled",
};

export function statusClassName(status: MatchStatus) {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "inProgress") return "bg-blue-100 text-blue-700";
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
    const isMine = !!currentUserId && (first.id === currentUserId || second.id === currentUserId);

    const scheduleLabel = scheduleText(
      match.startTime ?? fallbackDate,
      match.startTime ? null : fallbackStartTime,
      tbdLabel,
      locale
    );

    const courtName =
      match.court.name?.trim() ||
      t("tournaments.courtFallback", { number: match.slot });

    pairs.push({
      id: match.id,
      playerA: participantName(first.name, first.alias, t("tournaments.playerAFallback")),
      playerB: participantName(second.name, second.alias, t("tournaments.playerBFallback")),
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
  const active = matches.filter((m) => m.status !== "completed");
  if (active.length > 0) {
    return active.reduce((minRound, match) => Math.min(minRound, match.round), active[0].round);
  }
  return matches.reduce((maxRound, match) => Math.max(maxRound, match.round), matches[0].round);
}

export function getMatchCounts(matches: DerivedMatch[]): MatchCounts {
  let completedCount = 0;
  let inProgressCount = 0;
  let scheduledCount = 0;

  for (const match of matches) {
    if (match.status === "completed") {
      completedCount += 1;
    } else if (match.status === "inProgress") {
      inProgressCount += 1;
    } else {
      scheduledCount += 1;
    }
  }

  const progressPct = matches.length ? Math.round((completedCount / matches.length) * 100) : 0;

  return {
    completedCount,
    inProgressCount,
    scheduledCount,
    progressPct,
  };
}
