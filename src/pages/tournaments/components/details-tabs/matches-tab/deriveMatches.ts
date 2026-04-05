import type { Locale } from "date-fns";
import type { TournamentDetail } from "@/models/tournament/types";
import { formatDateOrFallback } from "@/utils/date";
import { formatTimeTo12Hour } from "@/utils/time";
import type { DerivedMatch, MatchCounts, MatchStatus, TournamentMatchOutcome } from "./types";

function participantName(name: string | null, alias: string | null, fallback: string) {
  return name || alias || fallback;
}

function scheduleText(
  date: string | null,
  startTime: string | null,
  tbdLabel: string,
  locale: Locale | undefined
) {
  const time = formatTimeTo12Hour(startTime);

  if (!date) return time ?? tbdLabel;

  const dateLabel = formatDateOrFallback(date, tbdLabel, "P", locale);
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

/**
 * Mock: builds bracket pairings from participant order and assigns {@link MatchStatus} by index
 * (not from API data). Pairing order is shared with the matches tab; {@link TournamentDetail}
 * does not yet expose per-match status on {@link TournamentMatchOutcome}.
 *
 * Used by deriveMatches and deriveResults so standings reflect the same schedule as long as
 * both rely on this mock.
 */
export function getMockMatchOutcomes(tournament: TournamentDetail): TournamentMatchOutcome[] {
  const participants = tournament.participants;
  const out: TournamentMatchOutcome[] = [];

  for (let index = 0; index < participants.length; index += 2) {
    const first = participants[index];
    const second = participants[index + 1];
    if (!first) continue;

    // TODO: Replace with real match status from backend
    // (TournamentDetail → per-match fields; map into TournamentMatchOutcome.status as MatchStatus.)
    const status: MatchStatus = index % 6 === 0 ? "completed" : index % 6 === 2 ? "inProgress" : "scheduled";
    out.push({ playerAId: first.id, playerBId: second?.id ?? null, status });
  }

  return out;
}

export function deriveMatches(
  tournament: TournamentDetail,
  currentUserId: string | null,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: Locale | undefined
): DerivedMatch[] {
  const outcomes = getMockMatchOutcomes(tournament);
  const participants = tournament.participants;
  const byId = new Map(participants.map((p) => [p.id, p]));
  const pairs: DerivedMatch[] = [];
  const tbdLabel = t("tournaments.scheduledTbd");

  for (let i = 0; i < outcomes.length; i++) {
    const o = outcomes[i];
    const first = byId.get(o.playerAId);
    if (!first) continue;
    const second = o.playerBId ? byId.get(o.playerBId) : null;

    const round = Math.floor(i / 3) + 1;
    const court = tournament.courts[i % Math.max(1, tournament.courts.length)];

    const isMine =
      !!currentUserId && (first.id === currentUserId || second?.id === currentUserId);

    pairs.push({
      id: `${first.id}-${second?.id ?? "bye"}`,
      playerA: participantName(first.name, first.alias, t("tournaments.playerAFallback")),
      playerB: participantName(second?.name ?? null, second?.alias ?? null, t("tournaments.playerBFallback")),
      courtName: court?.name || t("tournaments.courtFallback", { number: i + 1 }),
      status: o.status,
      round,
      isMine,
      scheduledText: scheduleText(tournament.date, tournament.startTime, tbdLabel, locale),
    });
  }

  return pairs;
}

/** Round where play is still open (min among incomplete); if all finished, last round. */
export function getCurrentRound(matches: DerivedMatch[]): number {
  if (matches.length === 0) return 1;
  const active = matches.filter((m) => m.status !== "completed");
  if (active.length > 0) {
    return Math.min(...active.map((m) => m.round));
  }
  return Math.max(...matches.map((m) => m.round));
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
