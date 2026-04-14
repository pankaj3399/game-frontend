import { useMemo } from "react";
import type { TFunction } from "i18next";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { TournamentDetail, TournamentScheduleMatch } from "@/models/tournament/types";
import { deriveMatches, getCurrentRound, getMatchCounts } from "./deriveMatches";

interface UseMatchesDataArgs {
  tournament: TournamentDetail;
  scheduleMatches: TournamentScheduleMatch[];
  currentUserId: string | null;
  onlyMyMatches: boolean;
  language: string;
  t: TFunction;
}

export function useMatchesData({
  tournament,
  scheduleMatches,
  currentUserId,
  onlyMyMatches,
  language,
  t,
}: UseMatchesDataArgs) {
  const locale = getDateFnsLocale(language);

  const matches = useMemo(
    () => deriveMatches(scheduleMatches, currentUserId, t, locale, tournament.date, tournament.startTime),
    [scheduleMatches, currentUserId, t, locale, tournament.date, tournament.startTime]
  );

  const filteredMatches = useMemo(
    () => (onlyMyMatches ? matches.filter((match) => match.isMine) : matches),
    [matches, onlyMyMatches]
  );

  const counts = useMemo(() => getMatchCounts(matches), [matches]);
  const currentRound = useMemo(() => getCurrentRound(matches), [matches]);

  return {
    matches,
    filteredMatches,
    counts,
    currentRound,
  };
}
