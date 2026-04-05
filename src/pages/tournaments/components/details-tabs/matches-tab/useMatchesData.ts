import { useMemo } from "react";
import type { TFunction } from "i18next";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { TournamentDetail } from "@/models/tournament/types";
import { deriveMatches, getCurrentRound, getMatchCounts } from "./deriveMatches";

interface UseMatchesDataArgs {
  tournament: TournamentDetail;
  currentUserId: string | null;
  onlyMyMatches: boolean;
  language: string;
  t: TFunction;
}

export function useMatchesData({
  tournament,
  currentUserId,
  onlyMyMatches,
  language,
  t,
}: UseMatchesDataArgs) {
  const locale = getDateFnsLocale(language);

  const matches = useMemo(
    () => deriveMatches(tournament, currentUserId, t, locale),
    [tournament, currentUserId, t, locale]
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
