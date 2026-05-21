import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { minutesToTime24, normalizeTimeTo24Hour } from "@/utils/time";

export type ResolveDefaultScheduleStartTimeInput = {
  targetRound: number;
  tournamentStartTime: string | null | undefined;
  matchDurationMinutes: number;
  matches: readonly Pick<TournamentScheduleMatch, "round" | "startTime" | "detachedFromRound">[];
  timeZone: string | null | undefined;
  now?: Date;
  fallbackStartTime?: string;
};

function formatTime24InTimeZone(date: Date, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value;
    const minute = parts.find((part) => part.type === "minute")?.value;
    if (hour == null || minute == null) {
      return null;
    }
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  } catch {
    return minutesToTime24(date.getHours() * 60 + date.getMinutes());
  }
}

export function resolveDefaultScheduleStartTime(
  input: ResolveDefaultScheduleStartTimeInput
): string {
  const fallback =
    normalizeTimeTo24Hour(input.fallbackStartTime) ??
    normalizeTimeTo24Hour(input.tournamentStartTime) ??
    "09:00";

  if (input.targetRound <= 1) {
    return normalizeTimeTo24Hour(input.tournamentStartTime) ?? fallback;
  }

  const durationMs = Math.max(1, input.matchDurationMinutes) * 60_000;
  let latestEndMs: number | null = null;

  for (const match of input.matches) {
    if (match.detachedFromRound != null) {
      continue;
    }
    if (match.round >= input.targetRound) {
      continue;
    }
    if (!match.startTime) {
      continue;
    }

    const startMs = Date.parse(match.startTime);
    if (!Number.isFinite(startMs)) {
      continue;
    }

    const endMs = startMs + durationMs;
    latestEndMs = latestEndMs == null ? endMs : Math.max(latestEndMs, endMs);
  }

  const now = input.now ?? new Date();
  const anchorMs = Math.max(latestEndMs ?? now.getTime(), now.getTime());
  const timeZone =
    input.timeZone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return formatTime24InTimeZone(new Date(anchorMs), timeZone) ?? fallback;
}
