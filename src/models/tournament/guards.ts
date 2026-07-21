import type {
  TournamentClubScope,
  TournamentDistanceFilter,
  TournamentParticipationFilter,
  TournamentWhenFilter,
} from "./types";

export function isTournamentWhenFilter(
  value: string,
): value is TournamentWhenFilter {
  return value === "future" || value === "past";
}

export function isTournamentDistanceFilter(
  value: string,
): value is TournamentDistanceFilter {
  return (
    value === "under50" || value === "between50And80" || value === "over80"
  );
}

export function isTournamentClubScope(
  value: string,
): value is TournamentClubScope {
  return value === "favorites";
}

export function isTournamentParticipationFilter(
  value: string,
): value is TournamentParticipationFilter {
  return value === "joined" || value === "notJoined" || value === "organisedByMe";
}
