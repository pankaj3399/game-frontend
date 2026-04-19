import type { TournamentDetail, TournamentScheduleMatch } from "@/models/tournament/types";
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
  const ids = team.map((p) => p?.id).filter((id): id is string => Boolean(id));
  if (ids.length > 0) {
    return ids;
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

/**
 * Standings are based on real completed matches from the API.
 * Each match win gives exactly 1 win; losses do not add wins.
 * Total score advantage is the cumulative numeric score difference across completed matches.
 */
export function deriveResults(
  tournament: TournamentDetail,
  matches: TournamentScheduleMatch[],
  unknownLabel: string
): ParticipantResult[] {
  const participants = tournament.participants;
  if (participants.length === 0) return [];

  const winsById = new Map<string, number>();
  const scoreAdvantageById = new Map<string, number>();

  for (const p of participants) {
    winsById.set(p.id, 0);
    scoreAdvantageById.set(p.id, 0);
  }

  matches.forEach((match) => {
    if (match.status !== "completed") {
      return;
    }

    applyScoreAdvantageBySide(match, scoreAdvantageById);

    const winnerIds = resolveWinnerIds(match);
    if (!winnerIds || winnerIds.length === 0) {
      return;
    }

    for (const id of winnerIds) {
      winsById.set(id, (winsById.get(id) ?? 0) + 1);
    }
  });

  const withScores: ParticipantResult[] = participants.map((participant) => ({
    id: participant.id,
    name: participantDisplayName(participant.name, participant.alias, unknownLabel),
    wins: winsById.get(participant.id) ?? 0,
    totalScoreAdvantage: scoreAdvantageById.get(participant.id) ?? 0,
    positionChange: 0,
  }));

  return withScores.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.totalScoreAdvantage !== a.totalScoreAdvantage) {
      return b.totalScoreAdvantage - a.totalScoreAdvantage;
    }
    return a.name.localeCompare(b.name);
  });
}
