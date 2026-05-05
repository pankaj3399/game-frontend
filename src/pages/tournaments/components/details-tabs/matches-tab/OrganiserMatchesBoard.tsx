import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import {
  useTournamentMatches,
} from "@/pages/tournaments/hooks";
import type { MatchCounts } from "@/pages/tournaments/components/details-tabs/matches-tab/types";
import { MatchesProgress, type OrganiserRoundFilter } from "@/pages/tournaments/components/details-tabs/matches-tab/MatchesProgress";
import { isRoundResolvedStatus } from "@/pages/tournaments/utils/matchStatus";
import useMatchEditor from "@/pages/tournaments/schedule/hooks/useMatchEditor";
import usePersistMatchScore from "@/pages/tournaments/schedule/hooks/usePersistMatchScore";
import type { TournamentDetail, TournamentScheduleMatch } from "@/models/tournament/types";
import { MatchScheduleCard } from "@/pages/tournaments/schedule/components/MatchScheduleCard";
import MatchScheduleSkeleton from "@/pages/tournaments/schedule/components/MatchScheduleSkeleton";
import { RoundLoadingSkeleton } from "@/pages/tournaments/schedule/components/RoundLoadingSkeleton";
import RescheduleWarningDialog from "@/pages/tournaments/schedule/components/RescheduleWarningDialog";

interface OrganiserMatchesBoardProps {
  tournament: TournamentDetail;
}

function countMatches(matches: TournamentScheduleMatch[]): MatchCounts {
  const counts = matches.reduce(
    (acc, match) => {
      acc[match.status] += 1;
      return acc;
    },
    {
      completed: 0,
      inProgress: 0,
      pendingScore: 0,
      scheduled: 0,
      cancelled: 0,
    } as Record<TournamentScheduleMatch["status"], number>
  );

  const total = matches.length;
  return {
    completedCount: counts.completed,
    inProgressCount: counts.inProgress,
    pendingScoreCount: counts.pendingScore,
    scheduledCount: counts.scheduled,
    cancelledCount: counts.cancelled,
    progressPct: total > 0 ? Math.round((counts.completed / total) * 100) : 0,
  };
}

export function OrganiserMatchesBoard({ tournament }: OrganiserMatchesBoardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [roundFilter, setRoundFilter] = useState<OrganiserRoundFilter>("all");
  const [isRescheduleWarningOpen, setIsRescheduleWarningOpen] = useState(false);
  const matchesQuery = useTournamentMatches(tournament.id, true);

  const { persistMatchScore, isPersisting, savingMatchId, saveErrorsByMatchId } = usePersistMatchScore({
    tournament,
    matchesQuery,
    t,
  });

  const {
    editingMatch,
    editableRows: scoreRows,
    openEditor,
    closeEditor,
    save: saveEditedScoreViaHook,
    updateRow: updateScoreSetRow,
  } = useMatchEditor({
    onSave: async (match, rows) => {
      const res = await persistMatchScore(match, rows, true);
      return res.ok;
    },
  });

  const allMatches = useMemo(
    () => matchesQuery.data?.matches ?? [],
    [matchesQuery.data?.matches]
  );

  const availableRounds = useMemo(
    () =>
      [...new Set(allMatches.map((match) => match.round))]
        .filter((round) => Number.isFinite(round))
        .sort((a, b) => a - b),
    [allMatches]
  );

  const filteredMatches = useMemo(() => {
    const source =
      roundFilter === "all"
        ? allMatches
        : allMatches.filter((match) => match.round === roundFilter);
    return source.slice().sort((left, right) => {
      // Real matches first, historical/rescheduled matches last
      const leftIsHistorical = left.detachedFromRound != null;
      const rightIsHistorical = right.detachedFromRound != null;
      if (leftIsHistorical !== rightIsHistorical) {
        return leftIsHistorical ? 1 : -1;
      }
      // Within same category, cancelled matches go after non-cancelled
      if (left.status === "cancelled" && right.status !== "cancelled") return 1;
      if (left.status !== "cancelled" && right.status === "cancelled") return -1;
      // Then sort by round
      if (left.round !== right.round) return left.round - right.round;
      // Finally by slot
      return left.slot - right.slot;
    });
  }, [allMatches, roundFilter]);

  const counts = useMemo(() => countMatches(filteredMatches), [filteredMatches]);

  const latestGeneratedRound = Math.max(
    matchesQuery.data?.schedule.currentRound ?? 0,
    availableRounds.length > 0 ? availableRounds[availableRounds.length - 1] : 0
  );
  const currentRound = Math.max(1, latestGeneratedRound || 1);
  const configuredTotalRounds = Math.max(
    1,
    tournament.totalRounds,
    matchesQuery.data?.schedule.totalRounds ?? 0
  );
  const hasGeneratedSchedule = allMatches.length > 0 || (matchesQuery.data?.schedule.currentRound ?? 0) > 0;
  const currentRoundMatches = allMatches.filter((match) => match.round === currentRound);
  const scoredMatchesCount = currentRoundMatches.filter((match) => {
    const p1 = match.score.playerOneScores?.length ?? 0;
    const p2 = match.score.playerTwoScores?.length ?? 0;
    return p1 > 0 || p2 > 0 || match.status === "completed" || match.status === "pendingScore";
  }).length;
  const allCurrentRoundResolved =
    currentRoundMatches.length > 0 &&
    currentRoundMatches.every((match) => isRoundResolvedStatus(match.status));
  const nextRound = currentRound + 1;
  const canScheduleNextRound = hasGeneratedSchedule
    ? allCurrentRoundResolved && nextRound <= configuredTotalRounds
    : true;
  const actionRound = canScheduleNextRound ? (hasGeneratedSchedule ? nextRound : 1) : currentRound;
  const showActionButton = canScheduleNextRound || currentRoundMatches.length > 0;
  const canRescheduleThisRound = !canScheduleNextRound && currentRoundMatches.length > 0;

  const dateLocale: Locale = getDateFnsLocale(i18n.language) ?? enUS;

  const handleToggleInlineEdit = async (match: TournamentScheduleMatch) => {
    if (match.status === "cancelled" || match.round !== currentRound || match.detachedFromRound != null) {
      return;
    }
    if (editingMatch?.id === match.id) {
      const ok = await saveEditedScoreViaHook();
      if (ok) closeEditor();
      return;
    }
    if (editingMatch && editingMatch.id !== match.id) {
      if (savingMatchId === editingMatch.id) return;
      const result = await persistMatchScore(editingMatch, scoreRows, true);
      if (!result.ok) return;
      openEditor(match);
      return;
    }
    openEditor(match);
  };

  const handleRoundAction = async () => {
    if (savingMatchId != null || isPersisting || editingMatch != null) {
      return;
    }
    if (tournament.participants.length < tournament.minMember) {
      toast.warning(
        t("tournaments.scheduleMinPlayersNotMet", {
          min: tournament.minMember,
          current: tournament.participants.length,
        }),
        { id: "tournaments-schedule-min-players" }
      );
      return;
    }

    if (canScheduleNextRound) {
      navigate(`/tournaments/${tournament.id}/schedule?round=${actionRound}`);
      return;
    }

    if (!canRescheduleThisRound) {
      toast.error(t("tournaments.scheduleRoundCancelError"));
      return;
    }

    if (scoredMatchesCount > 0) {
      setIsRescheduleWarningOpen(true);
      return;
    }

    navigate(`/tournaments/${tournament.id}/schedule?round=${actionRound}`);
  };

  const onConfirmRescheduleWarning = () => {
    setIsRescheduleWarningOpen(false);
    navigate(`/tournaments/${tournament.id}/schedule?round=${actionRound}`);
  };

  if (matchesQuery.isLoading) {
    return <MatchScheduleSkeleton />;
  }

  if (matchesQuery.isError || !matchesQuery.data) {
    return (
      <div className="rounded-[12px] border border-[#f1b3b3] bg-[#fff7f7] px-5 py-4 text-sm text-[#a02626]">
        {getErrorMessage(matchesQuery.error) ?? t("tournaments.matchesLoadError")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-0 pb-4 pt-0 sm:space-y-6">
      <div className="flex w-full justify-end">
        {showActionButton ? (
          <Button
            type="button"
            variant={canScheduleNextRound ? "default" : "outline"}
            onClick={() => void handleRoundAction()}
            disabled={isPersisting || savingMatchId != null || editingMatch != null}
            className={
              canScheduleNextRound
                ? "h-auto min-h-9 w-full justify-center whitespace-normal rounded-md bg-[#111827] px-4 py-2 text-center text-sm font-medium text-white hover:bg-black sm:w-auto sm:whitespace-nowrap"
                : "h-auto min-h-9 w-full justify-center whitespace-normal border-[#010a04]/20 px-4 py-2 text-center text-sm font-medium text-[#010a04] hover:bg-[#010a04]/5 sm:w-auto sm:whitespace-nowrap"
            }
          >
            {canScheduleNextRound
              ? t("tournaments.scheduleGamesRound", { round: actionRound })
              : t("tournaments.scheduleRescheduleWarningConfirm")}
          </Button>
        ) : null}
      </div>

      <MatchesProgress
        counts={counts}
        total={filteredMatches.length}
        roundFilter={roundFilter}
        availableRounds={availableRounds}
        onRoundFilterChange={setRoundFilter}
        t={t}
      />

      {matchesQuery.isFetching && filteredMatches.length === 0 ? (
        <RoundLoadingSkeleton />
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#010a04]/[0.12] bg-[#010a04]/[0.02] p-10 text-center text-[13px] text-[#010a04]/40">
          {t("tournaments.noMatchesAvailable")}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredMatches.map((match) => (
            <MatchScheduleCard
              key={match.id}
              match={match}
              locale={dateLocale}
              timeZone={tournament.timezone}
              t={t}
              canEditScores={match.status !== "cancelled" && match.round === currentRound && match.detachedFromRound == null}
              isEditing={editingMatch?.id === match.id}
              editableRows={editingMatch?.id === match.id ? scoreRows : []}
              isSavePending={savingMatchId === match.id}
              saveErrorMessage={saveErrorsByMatchId[match.id] ?? null}
              onToggleEdit={handleToggleInlineEdit}
              onScoreInputChange={updateScoreSetRow}
            />
          ))}
        </div>
      )}

      <RescheduleWarningDialog
        open={isRescheduleWarningOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsRescheduleWarningOpen(false);
          }
        }}
        round={actionRound}
        scoredMatches={scoredMatchesCount}
        onCancel={() => setIsRescheduleWarningOpen(false)}
        onConfirm={onConfirmRescheduleWarning}
        t={t}
      />
    </div>
  );
}
