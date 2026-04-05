import type { TournamentDetail } from "@/models/tournament/types";
import { getTournamentMatchOutcomes } from "../matches-tab/deriveMatches";
import type { ParticipantResult } from "./types";

function participantDisplayName(name: string | null, alias: string | null, fallback: string) {
  return name || alias || fallback;
}

/**
 * Standings from the same derived match list as the matches tab: wins and net advantage
 * come only from completed matches. `positionChange` stays 0 until prior standings exist in the API.
 */
export function deriveResults(tournament: TournamentDetail, unknownLabel: string): ParticipantResult[] {
  const participants = tournament.participants;
  if (participants.length === 0) return [];

  const outcomes = getTournamentMatchOutcomes(tournament);
  const winsById = new Map<string, number>();
  const advantageById = new Map<string, number>();

  for (const p of participants) {
    winsById.set(p.id, 0);
    advantageById.set(p.id, 0);
  }

  outcomes.forEach((m, matchIndex) => {
    if (m.status !== "completed") return;

    if (!m.playerBId) {
      winsById.set(m.playerAId, (winsById.get(m.playerAId) ?? 0) + 1);
      advantageById.set(m.playerAId, (advantageById.get(m.playerAId) ?? 0) + 1);
      return;
    }

    const winnerId = matchIndex % 2 === 0 ? m.playerAId : m.playerBId;
    const loserId = winnerId === m.playerAId ? m.playerBId : m.playerAId;

    winsById.set(winnerId, (winsById.get(winnerId) ?? 0) + 1);
    advantageById.set(winnerId, (advantageById.get(winnerId) ?? 0) + 1);
    advantageById.set(loserId, (advantageById.get(loserId) ?? 0) - 1);
  });

  const withScores: ParticipantResult[] = participants.map((participant) => ({
    id: participant.id,
    name: participantDisplayName(participant.name, participant.alias, unknownLabel),
    wins: winsById.get(participant.id) ?? 0,
    totalScoreAdvantage: advantageById.get(participant.id) ?? 0,
    positionChange: 0,
  }));

  return withScores.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalScoreAdvantage - a.totalScoreAdvantage;
  });
}
