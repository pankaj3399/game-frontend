import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { formatTime24InTimeZone, normalizeTimeTo24Hour } from "@/utils/time";

export type ResolveDefaultScheduleStartTimeInput = {
  targetRound: number;
  tournamentStartTime: string | null | undefined;
  matchDurationMinutes: number;
  matches: readonly Pick<TournamentScheduleMatch, "round" | "startTime" | "detachedFromRound">[];
  timeZone: string | null | undefined;
  now?: Date;
  fallbackStartTime?: string;
};

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

  const durationMinutes =
    Number.isFinite(input.matchDurationMinutes) && input.matchDurationMinutes > 0
      ? input.matchDurationMinutes
      : 1;
  const durationMs = durationMinutes * 60_000;
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

  return (
    formatTime24InTimeZone(new Date(anchorMs), timeZone) ??
    normalizeTimeTo24Hour(fallback) ??
    fallback
  );
}
