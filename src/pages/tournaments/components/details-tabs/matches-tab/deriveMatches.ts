import { isValid, parseISO, type Locale } from "date-fns";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { teamSideDisplayName } from "@/pages/tournaments/schedule/utils/matchTeamDisplay";
import { withBracketedElo } from "./ratingSummary";
import type { DerivedMatch, MatchCounts, MatchStatus } from "./types";

/* -------------------------------------------------------------------------- */
/*                               FORMAT HELPERS                               */
/* -------------------------------------------------------------------------- */

type ScheduleInput = {
  date: Date | null;
  time: Date | null;
};

const TIME_ONLY_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

function createDateFormatter(locale?: Locale) {
  return new Intl.DateTimeFormat(locale?.code ?? "en-US", {
    dateStyle: "short",
  });
}

function createTimeFormatter(locale?: Locale) {
  return new Intl.DateTimeFormat(locale?.code ?? "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseDateSafe(value: string | null): Date | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    const parsed = parseISO(normalized);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseTimeSafe(value: string | null, baseDate: Date): Date | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  try {
    const parsedIso = parseISO(normalized);
    if (isValid(parsedIso)) {
      return parsedIso;
    }
  } catch {
    // Falls back to strict HH:mm[:ss] parsing below.
  }

  const match = normalized.match(TIME_ONLY_PATTERN);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;

  const parsed = new Date(baseDate);
  parsed.setHours(hours, minutes, seconds, 0);
  return isValid(parsed) ? parsed : null;
}

function resolveFallbackScheduleInput(
  fallbackDate: string | null,
  fallbackTime: string | null
): ScheduleInput {
  const parsedDate = parseDateSafe(fallbackDate);
  const parsedTime = parseTimeSafe(fallbackTime, parsedDate ?? new Date());

  return {
    date: parsedDate,
    time: parsedTime,
  };
}

function resolveScheduleInput(
  matchStartTime: string | null,
  fallbackSchedule: ScheduleInput
): ScheduleInput {
  const parsedStart = parseDateSafe(matchStartTime);
  if (parsedStart) {
    return { date: parsedStart, time: parsedStart };
  }

  return fallbackSchedule;
}

function formatSchedule(
  input: ScheduleInput,
  tbdLabel: string,
  locale?: Locale
): string {
  const dateFormatter = createDateFormatter(locale);
  const timeFormatter = createTimeFormatter(locale);

  const dateLabel = input.date ? dateFormatter.format(input.date) : tbdLabel;
  const timeLabel = input.time ? timeFormatter.format(input.time) : tbdLabel;

  if (!input.date && !input.time) return tbdLabel;
  return `${timeLabel} (${dateLabel})`;
}

/* -------------------------------------------------------------------------- */
/*                              STATUS UTILITIES                              */
/* -------------------------------------------------------------------------- */

export const MATCH_STATUS_KEYS: Record<MatchStatus, string> = {
  completed: "tournaments.matchStatusCompleted",
  inProgress: "tournaments.matchStatusInProgress",
  pendingScore: "tournaments.matchStatusPendingScore",
  scheduled: "tournaments.matchStatusScheduled",
  cancelled: "tournaments.matchStatusCancelled",
};

const STATUS_CLASS: Record<MatchStatus, string> = {
  completed: "bg-green-100 text-green-700",
  inProgress: "bg-blue-100 text-blue-700",
  pendingScore: "bg-amber-100 text-amber-800",
  scheduled: "bg-gray-100 text-gray-500",
  cancelled: "bg-rose-100 text-rose-700",
};

export function statusClassName(status: MatchStatus) {
  return STATUS_CLASS[status];
}

/* -------------------------------------------------------------------------- */
/*                         VIEW MODEL (MAIN TRANSFORM)                        */
/* -------------------------------------------------------------------------- */

export function buildMatchViewModel(
  matches: TournamentScheduleMatch[],
  currentUserId: string | null,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: Locale | undefined,
  fallbackDate: string | null,
  fallbackTime: string | null
): DerivedMatch[] {
  const tbdLabel = t("tournaments.scheduledTbd");
  const fallbackScheduleInput = resolveFallbackScheduleInput(
    fallbackDate,
    fallbackTime
  );

  return matches.map((match) => {
    const isMine =
      !!currentUserId &&
      (match.players.some((p) => p?.id === currentUserId) ||
        match.side1.some((p) => p?.id === currentUserId) ||
        match.side2.some((p) => p?.id === currentUserId));

    const scheduleInput = resolveScheduleInput(match.startTime, fallbackScheduleInput);
    const scheduledText = formatSchedule(
      scheduleInput,
      tbdLabel,
      locale
    );

    const court = match.court;
    const courtName =
      court.name?.trim() ||
      (typeof court.number === "number"
        ? t("tournaments.courtFallback", { number: court.number })
        : null) ||
      court.id?.trim() ||
      t("tournaments.courtTBD");

    const playerA = withBracketedElo(
      teamSideDisplayName(match, 0, t),
      match.side1,
      (rating) => `(${rating})`
    );

    const playerB = withBracketedElo(
      teamSideDisplayName(match, 1, t),
      match.side2,
      (rating) => `(${rating})`
    );

    return {
      id: match.id,
      mode: match.mode ?? "singles",
      playerA,
      playerB,
      courtName,
      status: match.status,
      round: match.round,
      isMine,
      scheduledText,
    };
  });
}

// Backward-compatible export for existing call sites.
export const deriveMatches = buildMatchViewModel;

/* -------------------------------------------------------------------------- */
/*                             DERIVED CALCULATIONS                           */
/* -------------------------------------------------------------------------- */

export function getCurrentRound(matches: DerivedMatch[]): number {
  if (matches.length === 0) return 1;

  const active = matches.filter(
    (m) => m.status !== "completed" && m.status !== "cancelled"
  );

  if (active.length > 0) {
    return Math.min(...active.map((m) => m.round));
  }

  return Math.max(...matches.map((m) => m.round));
}

export function getMatchCounts(matches: DerivedMatch[]): MatchCounts {
  const counts = matches.reduce(
    (acc, match) => {
      acc[match.status] += 1;
      return acc;
    },
    {
      completed: 0,
      inProgress: 0,
      pendingScore: 0,
      scheduled: 0,
      cancelled: 0,
    } as Record<MatchStatus, number>
  );

  const total = matches.length;

  return {
    completedCount: counts.completed,
    inProgressCount: counts.inProgress,
    pendingScoreCount: counts.pendingScore,
    scheduledCount: counts.scheduled,
    cancelledCount: counts.cancelled,
    progressPct: total ? Math.round((counts.completed / total) * 100) : 0,
  };
}