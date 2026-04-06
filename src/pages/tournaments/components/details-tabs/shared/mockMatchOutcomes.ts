import type { TournamentDetail } from "@/models/tournament/types";
import type { MatchStatus, TournamentMatchOutcome } from "./types";

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
