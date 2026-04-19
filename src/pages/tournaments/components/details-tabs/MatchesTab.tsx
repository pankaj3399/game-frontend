import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import type { TournamentDetail } from "@/models/tournament/types";
import { useTournamentMatches } from "@/pages/tournaments/hooks";
import { MatchesTabSkeleton } from "@/pages/tournaments/components/TournamentDetailsLoadingSkeletons";
import { getErrorMessage } from "@/lib/errors";
import { getMatchCounts } from "./matches-tab/deriveMatches";
import { MatchesActions } from "./matches-tab/MatchesActions";
import { MatchesList } from "./matches-tab/MatchesList";
import { type OrganiserRoundFilter, MatchesProgress } from "./matches-tab/MatchesProgress";
import { PlayerMatchesBoard } from "./matches-tab/PlayerMatchesBoard";
import { useMatchesData } from "./matches-tab/useMatchesData";

interface MatchesTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

export function MatchesTab({ tournament, currentUserId }: MatchesTabProps) {
  const { t, i18n } = useTranslation();
  const [onlyMyMatches, setOnlyMyMatches] = useState(false);
  const [roundFilter, setRoundFilter] = useState<OrganiserRoundFilter>("all");

  const matchesQuery = useTournamentMatches(tournament.id, true);
  const scheduleMatches = matchesQuery.data?.matches ?? [];
  const scheduleInfo = matchesQuery.data?.schedule ?? null;
  const hasGeneratedSchedule =
    scheduleMatches.length > 0 ||
    (scheduleInfo != null && scheduleInfo.currentRound > 0);
  const latestGeneratedRound = scheduleMatches.reduce(
    (maxRound, match) => Math.max(maxRound, match.round),
    scheduleInfo?.currentRound ?? 0
  );
  const configuredTotalRounds = Math.max(
    1,
    tournament.totalRounds,
    scheduleInfo?.totalRounds ?? 0
  );
  const latestRoundMatches =
    latestGeneratedRound >= 1
      ? scheduleMatches.filter((match) => match.round === latestGeneratedRound)
      : [];
  const latestRoundCompleted =
    latestGeneratedRound >= 1 &&
    latestRoundMatches.length > 0 &&
    latestRoundMatches.every(
      (match) => match.status === "completed" || match.status === "cancelled"
    );
  const finalRoundReached =
    hasGeneratedSchedule && latestGeneratedRound >= configuredTotalRounds;
  const nextRoundToGenerate =
    tournament.permissions.canEdit &&
    hasGeneratedSchedule &&
    !finalRoundReached &&
    latestRoundCompleted
      ? latestGeneratedRound + 1
      : null;

  const { matches, currentRound } = useMatchesData({
    tournament,
    scheduleMatches,
    currentUserId,
    onlyMyMatches,
    language: i18n.language,
    t,
  });

  const availableRounds = useMemo(
    () =>
      [...new Set(matches.map((m) => m.round))]
        .filter((r) => Number.isFinite(r))
        .sort((a, b) => a - b),
    [matches]
  );

  const matchesForRound = useMemo(() => {
    if (roundFilter === "all") {
      return matches;
    }
    return matches.filter((m) => m.round === roundFilter);
  }, [matches, roundFilter]);

  const countsForRound = useMemo(() => getMatchCounts(matchesForRound), [matchesForRound]);

  const filteredMatches = useMemo(() => {
    return onlyMyMatches ? matchesForRound.filter((m) => m.isMine) : matchesForRound;
  }, [matchesForRound, onlyMyMatches]);

  if (matchesQuery.isLoading) {
    return <MatchesTabSkeleton t={t} />;
  }

  if (matchesQuery.isLoadingError) {
    return (
      <TabsContent value="matches" className="mt-5 sm:mt-6">
        <div className="rounded-xl border border-[#f1b3b3] bg-[#fff7f7] p-5 text-sm text-[#a02626]">
          {getErrorMessage(matchesQuery.error) ?? t("tournaments.matchesLoadError")}
        </div>
      </TabsContent>
    );
  }

  if (!tournament.permissions.canEdit) {
    return (
      <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
        <PlayerMatchesBoard
          matches={scheduleMatches}
          currentUserId={currentUserId}
          language={i18n.language}
          t={t}
        />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
      <MatchesActions
        t={t}
        round={Math.max(1, currentRound)}
        tournamentId={tournament.id}
        canEdit={tournament.permissions.canEdit}
        hasGeneratedSchedule={hasGeneratedSchedule}
        nextRoundToGenerate={nextRoundToGenerate}
        minTournamentMembers={tournament.minMember}
        enrolledParticipantCount={tournament.participants.length}
      />
      <MatchesProgress
        counts={countsForRound}
        total={matchesForRound.length}
        roundFilter={roundFilter}
        availableRounds={availableRounds}
        onRoundFilterChange={setRoundFilter}
        t={t}
      />
      <MatchesList
        matches={matches}
        filteredMatches={filteredMatches}
        onlyMyMatches={onlyMyMatches}
        onOnlyMyMatchesChange={setOnlyMyMatches}
        t={t}
      />
    </TabsContent>
  );
}
