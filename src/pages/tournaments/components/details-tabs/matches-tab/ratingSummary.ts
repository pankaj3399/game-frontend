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
  const deviations: number[] = [];

  for (const player of team) {
    const rating = player?.elo?.rating;
    if (typeof rating === "number" && Number.isFinite(rating)) {
      ratings.push(rating);
    }

    const rd = player?.elo?.rd;
    if (typeof rd === "number" && Number.isFinite(rd)) {
      deviations.push(rd);
    }
  }

  return {
    rating: average(ratings),
    rd: average(deviations),
  };
}

export function teamEloRating(team: Array<TournamentMatchPlayer | null>) {
  const { rating } = normalizedRatings(team);
  if (rating == null) {
    return null;
  }
  return Math.round(rating);
}

export function withBracketedElo(name: string, team: Array<TournamentMatchPlayer | null>) {
  const rating = teamEloRating(team);
  const trimmed = name.trim();

  if (!trimmed || rating == null) {
    return name;
  }

  return `${trimmed}(${rating})`;
}
