import type { MyScoreFilterMode } from "@/models/myScore/types";
import type { TournamentLiveMatchItem } from "@/models/tournament/types";
import { isOpenForScoreEntry } from "@/pages/tournaments/utils/matchScoring";

function isActiveScheduledMatch(match: TournamentLiveMatchItem): boolean {
  return isOpenForScoreEntry(match.status, match.score);
}

export function filterScheduledMatchesForMyScore(
  matches: TournamentLiveMatchItem[],
  mode: MyScoreFilterMode
): TournamentLiveMatchItem[] {
  const filtered = matches.filter((match) => {
    if (!isActiveScheduledMatch(match)) {
      return false;
    }
    return mode === "all" || match.mode === mode;
  });

  return [...filtered].sort((left, right) => {
    const leftParsed = left.startTime ? Date.parse(left.startTime) : Number.NaN;
    const rightParsed = right.startTime ? Date.parse(right.startTime) : Number.NaN;
    const leftTime = Number.isNaN(leftParsed) ? Number.NEGATIVE_INFINITY : leftParsed;
    const rightTime = Number.isNaN(rightParsed) ? Number.NEGATIVE_INFINITY : rightParsed;
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return left.id.localeCompare(right.id);
  });
}

/** Warm highlight for upcoming matches (matches tournament schedule cards). */
export const MY_SCORE_SCHEDULED_SURFACE_CLASS =
  "border-[#b45309]/25 bg-[#fffaf3]";

export const MY_SCORE_SCHEDULED_SURFACE_HOVER_CLASS = "hover:bg-[#fff6eb]";

export function buildTournamentRecordScorePath(match: TournamentLiveMatchItem): string | null {
  const tournamentId = match.tournament.id?.trim();
  if (!tournamentId) {
    return null;
  }

  const params = new URLSearchParams({
    tournamentId,
    matchId: match.id,
  });
  return `/record-score/manual?${params.toString()}`;
}

export function matchNeedsRecordScoreShortcut(match: TournamentLiveMatchItem): boolean {
  return Boolean(match.tournament.id?.trim()) && isOpenForScoreEntry(match.status, match.score);
}
