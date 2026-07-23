import type { TournamentMatchPlayer } from "@/models/tournament/types";

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function normalizedRatings(team: Array<TournamentMatchPlayer | null>) {
  const ratings: number[] = [];

  for (const player of team) {
    const rating = player?.snapshotElo?.rating ?? player?.elo?.rating;
    if (typeof rating === "number" && Number.isFinite(rating)) {
      ratings.push(rating);
    }
  }

  return {
    rating: average(ratings),
  };
}

export function teamEloRating(team: Array<TournamentMatchPlayer | null>) {
  const { rating } = normalizedRatings(team);
  if (rating == null) {
    return null;
  }
  return Math.round(rating);
}
