import type { TournamentDetail, TournamentScheduleMatch } from "@/models/tournament/types";
import { isRoundResolvedStatus } from "@/pages/tournaments/utils/matchStatus";
import type { ParticipantResult } from "./types";

function participantDisplayName(name: string | null, alias: string | null, fallback: string) {
  return name || alias || fallback;
}

function getNumericScoreTotal(scores: Array<number | "wo">): number {
  return scores.reduce<number>(
    (sum, value) => (typeof value === "number" ? sum + value : sum),
    0
  );
}

function compareSetScore(
  playerOne: number | "wo" | undefined,
  playerTwo: number | "wo" | undefined
): number {
  if (playerOne == null || playerTwo == null) {
    return 0;
  }

  if (playerOne === "wo" && playerTwo === "wo") {
    return 0;
  }

  if (playerOne === "wo") {
    return -1;
  }

  if (playerTwo === "wo") {
    return 1;
  }

  if (playerOne === playerTwo) {
    return 0;
  }

  return playerOne > playerTwo ? 1 : -1;
}

/** Player ids for schedule side 0 / 1 (doubles teams or singles slot). */
function getSidePlayerIds(match: TournamentScheduleMatch, side: 0 | 1): string[] {
  const team = side === 0 ? match.side1 : match.side2;
  if (team && team.length > 0) {
    const ids = team.map((p) => p?.id).filter((id): id is string => Boolean(id));
    if (ids.length > 0) {
      return ids;
    }
  }

  const slot = match.players[side];
  return slot?.id ? [slot.id] : [];
}

function applyScoreAdvantageBySide(match: TournamentScheduleMatch, scoreAdvantageById: Map<string, number>) {
  const playerOneTotal = getNumericScoreTotal(match.score.playerOneScores);
  const playerTwoTotal = getNumericScoreTotal(match.score.playerTwoScores);
  const scoreDelta = playerOneTotal - playerTwoTotal;

  const sideOneIds = getSidePlayerIds(match, 0);
  const sideTwoIds = getSidePlayerIds(match, 1);

  if (sideOneIds.length === 0 || sideTwoIds.length === 0) {
    return;
  }

  for (const id of sideOneIds) {
    scoreAdvantageById.set(id, (scoreAdvantageById.get(id) ?? 0) + scoreDelta);
  }
  for (const id of sideTwoIds) {
    scoreAdvantageById.set(id, (scoreAdvantageById.get(id) ?? 0) - scoreDelta);
  }
}

/** Winning side's player ids, or `null` on tie / indeterminate. */
function resolveWinnerIds(match: TournamentScheduleMatch): string[] | null {
  const sideOneIds = getSidePlayerIds(match, 0);
  const sideTwoIds = getSidePlayerIds(match, 1);
  if (sideOneIds.length === 0 || sideTwoIds.length === 0) {
    return null;
  }

  const playerOneScores = match.score.playerOneScores;
  const playerTwoScores = match.score.playerTwoScores;
  const setCount = Math.max(playerOneScores.length, playerTwoScores.length);
  let playerOneSetWins = 0;
  let playerTwoSetWins = 0;

  for (let index = 0; index < setCount; index += 1) {
    const setResult = compareSetScore(playerOneScores[index], playerTwoScores[index]);
    if (setResult > 0) {
      playerOneSetWins += 1;
    } else if (setResult < 0) {
      playerTwoSetWins += 1;
    }
  }

  if (playerOneSetWins !== playerTwoSetWins) {
    return playerOneSetWins > playerTwoSetWins ? sideOneIds : sideTwoIds;
  }

  const playerOneTotal = getNumericScoreTotal(playerOneScores);
  const playerTwoTotal = getNumericScoreTotal(playerTwoScores);

  if (playerOneTotal === playerTwoTotal) {
    return null;
  }

  return playerOneTotal > playerTwoTotal ? sideOneIds : sideTwoIds;
}

function sortStandings(a: ParticipantResult, b: ParticipantResult): number {
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.totalScoreAdvantage !== a.totalScoreAdvantage) {
    return b.totalScoreAdvantage - a.totalScoreAdvantage;
  }
  return a.name.localeCompare(b.name);
}

type ParticipantLike = {
  id: string;
  name: string | null;
  alias: string | null;
  hasLeft: boolean;
};

type ResolvedParticipantLike = {
  id: string;
  name: string;
  hasLeft: boolean;
};

function deriveParticipantPool(
  tournament: TournamentDetail,
  matches: TournamentScheduleMatch[],
  unknownLabel: string
): ResolvedParticipantLike[] {
  const byId = new Map<string, ParticipantLike>();

  for (const participant of tournament.participants) {
    byId.set(participant.id, {
      id: participant.id,
      name: participant.name,
      alias: participant.alias,
      hasLeft: false,
    });
  }

  const upsertFromMatchSlot = (
    candidate: { id: string; name: string | null; alias: string | null } | null
  ) => {
    if (!candidate?.id) return;
    const current = byId.get(candidate.id);
    if (!current) {
      byId.set(candidate.id, {
        id: candidate.id,
        name: candidate.name,
        alias: candidate.alias,
        hasLeft: true,
      });
      return;
    }

    // Prefer populated names from match payload if current value is empty.
    byId.set(candidate.id, {
      ...current,
      name: current.name ?? candidate.name,
      alias: current.alias ?? candidate.alias,
    });
  };

  for (const match of matches) {
    for (const sidePlayer of [...(match.side1 ?? []), ...(match.side2 ?? [])]) {
      upsertFromMatchSlot(sidePlayer);
    }
    for (const flatPlayer of match.players ?? []) {
      upsertFromMatchSlot(flatPlayer);
    }
  }

  if (byId.size === 0) {
    return [];
  }

  return [...byId.values()].map((participant) => ({
    id: participant.id,
    name: participantDisplayName(participant.name, participant.alias, unknownLabel),
    hasLeft: participant.hasLeft,
  }));
}

function deriveStandingsUpToRound(
  tournament: TournamentDetail,
  matches: TournamentScheduleMatch[],
  unknownLabel: string,
  roundLimit: number
): ParticipantResult[] {
  const participants = deriveParticipantPool(tournament, matches, unknownLabel);
  if (participants.length === 0) {
    return [];
  }

  const winsById = new Map<string, number>();
  const scoreAdvantageById = new Map<string, number>();

  for (const p of participants) {
    winsById.set(p.id, 0);
    scoreAdvantageById.set(p.id, 0);
  }

  for (const match of matches) {
    if (match.round > roundLimit || match.status !== "completed") {
      continue;
    }

    applyScoreAdvantageBySide(match, scoreAdvantageById);

    const winnerIds = resolveWinnerIds(match);
    if (!winnerIds || winnerIds.length === 0) {
      continue;
    }

    for (const id of winnerIds) {
      winsById.set(id, (winsById.get(id) ?? 0) + 1);
    }
  }

  return participants
    .map((participant) => ({
      id: participant.id,
      name: participant.name,
      hasLeft: participant.hasLeft,
      wins: winsById.get(participant.id) ?? 0,
      totalScoreAdvantage: scoreAdvantageById.get(participant.id) ?? 0,
      positionChange: 0,
    }))
    .sort(sortStandings);
}

function resolveLatestResolvedRound(matches: TournamentScheduleMatch[]): number {
  if (matches.length === 0) {
    return 0;
  }

  const matchesByRound = new Map<number, TournamentScheduleMatch[]>();
  for (const match of matches) {
    const round = Math.max(1, Math.trunc(match.round));
    const current = matchesByRound.get(round);
    if (current) {
      current.push(match);
    } else {
      matchesByRound.set(round, [match]);
    }
  }

  const rounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
  let latestResolvedRound = rounds[0] - 1;
  for (const round of rounds) {
    if (round !== latestResolvedRound + 1) {
      break;
    }

    const roundMatches = matchesByRound.get(round) ?? [];
    if (roundMatches.length === 0 || !roundMatches.every((match) => isRoundResolvedStatus(match.status))) {
      break;
    }

    latestResolvedRound = round;
  }

  return Math.max(0, latestResolvedRound);
}

/**
 * Standings are based on real completed matches from the API.
 * We only include matches up to the latest fully resolved round
 * (every match in the round is completed or cancelled), so the
 * leaderboard updates when a round closes, not mid-round.
 */
export function deriveResults(
  tournament: TournamentDetail,
  matches: TournamentScheduleMatch[],
  unknownLabel: string
): ParticipantResult[] {
  const latestResolvedRound = resolveLatestResolvedRound(matches);
  const currentStandings = deriveStandingsUpToRound(
    tournament,
    matches,
    unknownLabel,
    latestResolvedRound
  );

  if (latestResolvedRound <= 1) {
    return currentStandings;
  }

  const previousStandings = deriveStandingsUpToRound(
    tournament,
    matches,
    unknownLabel,
    latestResolvedRound - 1
  );
  const previousPositionById = new Map(
    previousStandings.map((result, index) => [result.id, index + 1])
  );

  return currentStandings.map((result, index) => {
    const currentPosition = index + 1;
    const previousPosition = previousPositionById.get(result.id);
    return {
      ...result,
      positionChange:
        previousPosition == null ? 0 : previousPosition - currentPosition,
    };
  });
}
