import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";

import { useTournamentMatches } from "@/pages/tournaments/hooks";
import { MatchesProgress, type OrganiserRoundFilter } from "@/pages/tournaments/components/details-tabs/matches-tab/MatchesProgress";
import { isRoundResolvedStatus } from "@/pages/tournaments/utils/matchStatus";

import useMatchEditor from "@/pages/tournaments/schedule/hooks/useMatchEditor";
import usePersistMatchScore from "@/pages/tournaments/schedule/hooks/usePersistMatchScore";

import type { TournamentDetail, TournamentScheduleMatch } from "@/models/tournament/types";

import { MatchScheduleCard } from "@/pages/tournaments/schedule/components/MatchScheduleCard";
import MatchScheduleSkeleton from "@/pages/tournaments/schedule/components/MatchScheduleSkeleton";
import { RoundLoadingSkeleton } from "@/pages/tournaments/schedule/components/RoundLoadingSkeleton";
import RescheduleWarningDialog from "@/pages/tournaments/schedule/components/RescheduleWarningDialog";

/* ---------------- utils ---------------- */

function countMatches(matches: TournamentScheduleMatch[]) {
  const counts = {
    completed: 0,
    inProgress: 0,
    pendingScore: 0,
    scheduled: 0,
    cancelled: 0,
  };

  for (const m of matches) {
    counts[m.status]++;
  }

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

function parseRoundFilter(searchParams: URLSearchParams): OrganiserRoundFilter {
  const roundParam = searchParams.get("round");

  if (roundParam === "all" || roundParam == null) return "all";

  const round = Number.parseInt(roundParam, 10);
  return Number.isFinite(round) && round > 0 && String(round) === roundParam
    ? round
    : "all";
}

/**
 * Ordering: current-round matches still open → other open matches → finished (incl. historical) → cancelled.
 */
function compareOrganiserMatchOrder(
  a: TournamentScheduleMatch,
  b: TournamentScheduleMatch,
  currentRound: number
): number {
  const tier = (m: TournamentScheduleMatch): number => {
    if (m.status === "cancelled") return 4;
    if (m.detachedFromRound != null) return 3;
    const open =
      m.status === "scheduled" || m.status === "inProgress" || m.status === "pendingScore";
    if (m.round === currentRound && open) return 0;
    if (open) return 1;
    return 2;
  };

  const ta = tier(a);
  const tb = tier(b);
  if (ta !== tb) return ta - tb;
  if (a.round !== b.round) return a.round - b.round;
  return a.slot - b.slot;
}

function isOrganiserScoreEditLocked(tournament: TournamentDetail): boolean {
  const deadline = tournament.organiserScoreEditDeadline;
  if (deadline == null || deadline === "") return false;
  const t = new Date(deadline).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() > t;
}

/* ---------------- component ---------------- */

export function OrganiserMatchesBoard({ tournament }: { tournament: TournamentDetail }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isRescheduleWarningOpen, setIsRescheduleWarningOpen] = useState(false);

  /* ---------------- URL STATE ---------------- */

  const roundFilter = useMemo(
    () => parseRoundFilter(searchParams),
    [searchParams]
  );

  /* ---------------- DATA ---------------- */

  const matchesQuery = useTournamentMatches(tournament.id, true);
  const allMatches = matchesQuery.data?.matches ?? [];

  /* ---------------- DERIVED ---------------- */

  const availableRounds = useMemo(() => {
    const set = new Set<number>();
    for (const m of allMatches) {
      if (Number.isFinite(m.round)) set.add(m.round);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allMatches]);

  const latestGeneratedRound = Math.max(
    1,
    matchesQuery.data?.schedule.currentRound ?? 1
  );

  const currentRound = latestGeneratedRound;

  const filteredMatches = useMemo(() => {
    const source =
      roundFilter === "all"
        ? allMatches
        : allMatches.filter((m) => m.round === roundFilter);

    return [...source].sort((a, b) =>
      compareOrganiserMatchOrder(a, b, currentRound)
    );
  }, [allMatches, roundFilter, currentRound]);

  const counts = useMemo(() => countMatches(filteredMatches), [filteredMatches]);

  /* ---------------- ROUND STATE ---------------- */

  const configuredTotalRounds = Math.max(
    1,
    tournament.totalRounds,
    matchesQuery.data?.schedule.totalRounds ?? 0
  );

  const hasGeneratedSchedule =
    allMatches.length > 0 || (matchesQuery.data?.schedule.currentRound ?? 0) > 0;

  const currentRoundMatches = allMatches.filter(
    (m) => m.round === currentRound && m.detachedFromRound == null
  );

  const scoredMatchesCount = currentRoundMatches.filter((m) => {
    const p1 = m.score.playerOneScores?.length ?? 0;
    const p2 = m.score.playerTwoScores?.length ?? 0;
    return p1 > 0 || p2 > 0 || m.status === "completed" || m.status === "pendingScore";
  }).length;

  const allCurrentRoundResolved =
    currentRoundMatches.length > 0 &&
    currentRoundMatches.every((m) => isRoundResolvedStatus(m.status));

  const nextRound = currentRound + 1;

  const canScheduleNextRound = hasGeneratedSchedule
    ? allCurrentRoundResolved && nextRound <= configuredTotalRounds
    : true;

  const actionRound = canScheduleNextRound
    ? hasGeneratedSchedule
      ? nextRound
      : 1
    : currentRound;

  const canRescheduleThisRound =
    !canScheduleNextRound && currentRoundMatches.length > 0;

  const showActionButton =
    canScheduleNextRound || currentRoundMatches.length > 0;

  const organiserScoreEditLocked = isOrganiserScoreEditLocked(tournament);

  /* ---------------- MUTATIONS ---------------- */

  const { persistMatchScore, isPersisting, savingMatchId, saveErrorsByMatchId } =
    usePersistMatchScore({ tournament, matchesQuery, t });

  const {
    editingMatch,
    editableRows,
    openEditor,
    closeEditor,
    save,
    updateRow,
  } = useMatchEditor({
    onSave: async (match, rows) => {
      const res = await persistMatchScore(match, rows, true);
      return res.ok;
    },
  });

  /* ---------------- HANDLERS ---------------- */

  const handleRoundFilterChange = (next: OrganiserRoundFilter) => {
    const nextParams = new URLSearchParams(searchParams);

    if (next === "all") nextParams.delete("round");
    else nextParams.set("round", String(next));

    setSearchParams(nextParams);
  };

  const handleToggleInlineEdit = async (match: TournamentScheduleMatch) => {
    if (
      organiserScoreEditLocked ||
      match.status === "cancelled" ||
      match.detachedFromRound != null
    ) {
      return;
    }

    if (editingMatch?.id === match.id) {
      const ok = await save();
      if (ok) closeEditor();
      return;
    }

    if (editingMatch && editingMatch.id !== match.id) {
      if (savingMatchId === editingMatch.id) return;

      const result = await persistMatchScore(editingMatch, editableRows, true);
      if (!result.ok) return;
    }

    openEditor(match);
  };

  const handleRoundAction = async () => {
    if (savingMatchId != null || isPersisting || editingMatch != null) return;

    if (tournament.participants.length < tournament.minMember) {
      toast.warning(
        t("tournaments.scheduleMinPlayersNotMet", {
          min: tournament.minMember,
          current: tournament.participants.length,
        })
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

  const dateLocale: Locale = getDateFnsLocale(i18n.language) ?? enUS;

  /* ---------------- RENDER ---------------- */

  if (matchesQuery.isLoading) return <MatchScheduleSkeleton />;

  if (matchesQuery.isError || !matchesQuery.data) {
    return (
      <div className="error-box">
        {getErrorMessage(matchesQuery.error) ?? t("tournaments.matchesLoadError")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {showActionButton && (
          <Button
            onClick={() => void handleRoundAction()}
            disabled={isPersisting || savingMatchId != null || editingMatch != null}
          >
            {canScheduleNextRound
              ? t("tournaments.scheduleGamesRound", { round: actionRound })
              : t("tournaments.scheduleRescheduleWarningConfirm")}
          </Button>
        )}
      </div>

      <MatchesProgress
        counts={counts}
        total={filteredMatches.length}
        roundFilter={roundFilter}
        availableRounds={availableRounds}
        onRoundFilterChange={handleRoundFilterChange}
        t={t}
      />

      {matchesQuery.isFetching && filteredMatches.length === 0 ? (
        <RoundLoadingSkeleton />
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
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
              canEditScores={
                !organiserScoreEditLocked &&
                match.status !== "cancelled" &&
                match.detachedFromRound == null
              }
              isEditing={editingMatch?.id === match.id}
              editableRows={editingMatch?.id === match.id ? editableRows : []}
              isSavePending={savingMatchId === match.id}
              saveErrorMessage={saveErrorsByMatchId[match.id] ?? null}
              onToggleEdit={handleToggleInlineEdit}
              onScoreInputChange={updateRow}
            />
          ))}
        </div>
      )}

      <RescheduleWarningDialog
        open={isRescheduleWarningOpen}
        onOpenChange={setIsRescheduleWarningOpen}
        round={actionRound}
        scoredMatches={scoredMatchesCount}
        onCancel={() => setIsRescheduleWarningOpen(false)}
        onConfirm={onConfirmRescheduleWarning}
        t={t}
      />
    </div>
  );
}
