import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentSchedulePairPlayer,
} from "@/models/tournament/types";

type PairableParticipant = {
  id: string;
  name: string | null;
  alias: string | null;
  rating?: number | null;
};

export type DoublesPartnerById = Record<string, string>;

function storageKey(tournamentId: string): string {
  return `tournament:doubles-pairs:${tournamentId}`;
}

function asPairPlayer(participant: PairableParticipant): TournamentSchedulePairPlayer {
  return {
    id: participant.id,
    name: participant.name,
    alias: participant.alias,
    skillLabel: "",
    rating: Number.isFinite(participant.rating) ? Number(participant.rating) : 0,
  };
}

export function loadDoublesPartnerById(tournamentId: string): DoublesPartnerById {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey(tournamentId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as DoublesPartnerById;
  } catch {
    return {};
  }
}

export function saveDoublesPartnerById(tournamentId: string, partnerById: DoublesPartnerById): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey(tournamentId), JSON.stringify(partnerById));
}

export function sanitizeDoublesPartnerById(
  partnerById: DoublesPartnerById,
  participants: PairableParticipant[]
): DoublesPartnerById {
  const validIds = new Set(participants.map((participant) => participant.id));
  const next: DoublesPartnerById = {};

  for (const participant of participants) {
    const partnerId = partnerById[participant.id];
    if (!partnerId || !validIds.has(partnerId) || partnerId === participant.id) {
      continue;
    }
    if (partnerById[partnerId] !== participant.id) {
      continue;
    }
    next[participant.id] = partnerId;
  }

  return next;
}

export function buildDoublesPairsResponse(
  participants: PairableParticipant[],
  partnerById: DoublesPartnerById
): GenerateTournamentDoublesPairsResponse {
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const used = new Set<string>();
  const teams: Array<{ team: number; players: [TournamentSchedulePairPlayer, TournamentSchedulePairPlayer] }> = [];
  const unpaired: TournamentSchedulePairPlayer[] = [];

  let teamNo = 1;
  for (const participant of participants) {
    if (used.has(participant.id)) {
      continue;
    }

    const partnerId = partnerById[participant.id];
    const partner = partnerId ? byId.get(partnerId) : undefined;
    if (partner && !used.has(partner.id) && partnerById[partner.id] === participant.id) {
      teams.push({
        team: teamNo,
        players: [
          asPairPlayer(participant),
          asPairPlayer(partner),
        ],
      });
      teamNo += 1;
      used.add(participant.id);
      used.add(partner.id);
      continue;
    }

    used.add(participant.id);
    unpaired.push(asPairPlayer(participant));
  }

  return { teams, unpaired };
}
