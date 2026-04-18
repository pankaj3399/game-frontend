import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import type { TournamentDetail } from "@/models/tournament/types";
import { useTournamentMatches } from "@/pages/tournaments/hooks";
import { getErrorMessage } from "@/lib/errors";
import { MatchesActions } from "./matches-tab/MatchesActions";
import { MatchesList } from "./matches-tab/MatchesList";
import { MatchesProgress } from "./matches-tab/MatchesProgress";
import { PlayerMatchesBoard } from "./matches-tab/PlayerMatchesBoard";
import { useMatchesData } from "./matches-tab/useMatchesData";

interface MatchesTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

export function MatchesTab({ tournament, currentUserId }: MatchesTabProps) {
  const { t, i18n } = useTranslation();
  const [onlyMyMatches, setOnlyMyMatches] = useState(false);

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
    latestRoundMatches.every((match) => match.status === "completed");
  const finalRoundReached =
    hasGeneratedSchedule && latestGeneratedRound >= configuredTotalRounds;
  const nextRoundToGenerate =
    tournament.permissions.canEdit &&
    hasGeneratedSchedule &&
    !finalRoundReached &&
    latestRoundCompleted
      ? latestGeneratedRound + 1
      : null;

  const { matches, filteredMatches, counts, currentRound } = useMatchesData({
    tournament,
    scheduleMatches,
    currentUserId,
    onlyMyMatches,
    language: i18n.language,
    t,
  });

  if (matchesQuery.isLoading) {
    return (
      <TabsContent value="matches" className="mt-5 sm:mt-6">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 text-sm text-[#6b7280]">
          {t("common.loading")}
        </div>
      </TabsContent>
    );
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
          tournamentId={tournament.id}
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
      />
      <MatchesProgress counts={counts} total={matches.length} currentRound={currentRound} t={t} />
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
