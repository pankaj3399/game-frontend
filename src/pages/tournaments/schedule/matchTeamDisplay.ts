import type { TournamentMatchPlayer, TournamentScheduleMatch } from "@/models/tournament/types";

/** Narrow i18n `t` shape so callers are not forced to import branded `TFunction`. */
export type MatchScheduleTranslate = (key: string, options?: Record<string, unknown>) => string;

function matchPlayerName(player: TournamentMatchPlayer | null, fallback: string): string {
  if (!player) {
    return fallback;
  }
  const trimmed = (player.name ?? player.alias ?? "").trim();
  return trimmed || fallback;
}

/**
 * Display label for one side of a schedule match: singles = one player; doubles = "A / B" when both partners exist.
 * Does not use "Player B" for an empty second slot in singles (returns "" when the opponent is unknown).
 */
export function teamSideDisplayName(
  match: TournamentScheduleMatch,
  teamIndex: 0 | 1,
  t: MatchScheduleTranslate
): string {
  const mode = match.mode ?? "singles";
  const teamPlayers = teamIndex === 0 ? match.side1 : match.side2;
  const legacySlot = match.players[teamIndex];

  const fallbackSide0 = t("tournaments.playerAFallback");
  const fallbackSide1Doubles = t("tournaments.playerBFallback");
  const emptySinglesOpponent = "";

  if (mode === "singles") {
    const player = teamPlayers.find((p) => p != null) ?? null;
    if (player) {
      return matchPlayerName(
        player,
        teamIndex === 0 ? fallbackSide0 : emptySinglesOpponent
      );
    }
  } else {
    const names = teamPlayers
      .map((player, index) => {
        if (!player) {
          return null;
        }
        const slotFallback = index === 0 ? fallbackSide0 : fallbackSide1Doubles;
        const label = matchPlayerName(player, slotFallback).trim();
        return label.length > 0 ? label : null;
      })
      .filter((n): n is string => n != null);

    if (names.length >= 2) {
      return `${names[0]} / ${names[1]}`;
    }
    if (names.length === 1) {
      return names[0];
    }
  }

  if (teamIndex === 1 && mode === "singles" && !legacySlot) {
    return "";
  }

  return matchPlayerName(
    legacySlot,
    teamIndex === 0 ? fallbackSide0 : mode === "singles" ? emptySinglesOpponent : fallbackSide1Doubles
  );
}
