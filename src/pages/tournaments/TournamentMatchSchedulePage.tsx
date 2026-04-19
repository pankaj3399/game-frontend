import { useCallback, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import {
  ChevronLeft,
  IconPlus,
} from "@/icons/figma-icons";
import {
  useGenerateTournamentSchedule,
  useRecordTournamentMatchScore,
  useTournamentById,
  useTournamentMatches,
  useTournamentSchedule,
} from "@/pages/tournaments/hooks";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { MatchScheduleCard } from "@/pages/tournaments/schedule/MatchScheduleCard";
import { buildMatchSchedulePageModel } from "@/pages/tournaments/schedule/matchScheduleViewModel";
import {
  buildScorePayload,
  createScoreEditorRows,
  type ScoreEditorRow,
} from "@/pages/tournaments/schedule/matchScheduleScore";
import {
  canGenerateSchedule,
  normalizeParticipantRows,
  participantOrderIds,
} from "@/pages/tournaments/schedule/helpers";
import { clampTime24ToBounds, resolveTournamentScheduleTimeBounds } from "@/utils/time";

function MatchScheduleSkeleton() {
  const { t } = useTranslation();
  const placeholders = [0, 1, 2, 3];

  return (
    <div
      className="mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t("common.loading")}</span>
      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-4 py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div
              className="h-8 w-8 shrink-0 animate-skeleton-soft rounded-md bg-[rgba(1,10,4,0.08)]"
              aria-hidden
            />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="h-7 w-[min(100%,13rem)] max-w-full animate-skeleton-soft rounded-md bg-[rgba(1,10,4,0.08)] sm:h-8" />
              <div
                className="h-6 w-10 shrink-0 animate-skeleton-soft rounded-md bg-[rgba(1,10,4,0.08)]"
                aria-hidden
              />
            </div>
          </div>
          <div
            className="h-[34px] w-28 shrink-0 animate-skeleton-soft rounded-[8px] bg-[rgba(1,10,4,0.08)] sm:w-36"
            aria-hidden
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {placeholders.map((index) => (
            <article
              key={`match-schedule-skeleton-${index}`}
              className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-[#f8faf9] p-4"
            >
              <div className="mb-4 h-4 w-2/3 animate-skeleton-soft rounded bg-[rgba(1,10,4,0.08)]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-5 w-32 animate-skeleton-soft rounded bg-[rgba(1,10,4,0.08)]" />
                  <div className="h-8 w-40 animate-skeleton-soft rounded bg-[rgba(1,10,4,0.08)]" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="h-5 w-28 animate-skeleton-soft rounded bg-[rgba(1,10,4,0.08)]" />
                  <div className="h-8 w-40 animate-skeleton-soft rounded bg-[rgba(1,10,4,0.08)]" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TournamentMatchSchedulePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [editingMatch, setEditingMatch] = useState<TournamentScheduleMatch | null>(null);
  const [scoreRows, setScoreRows] = useState<ScoreEditorRow[]>([]);

  const tournamentQuery = useTournamentById(id ?? null, Boolean(id));
  const matchesQuery = useTournamentMatches(id ?? null, Boolean(id));
  const scheduleQuery = useTournamentSchedule(id ?? null, Boolean(id));
  const generateScheduleMutation = useGenerateTournamentSchedule();
  const recordScoreMutation = useRecordTournamentMatchScore();
  const nextRoundHintId = useId();

  if (!id) {
    return <Navigate to="/tournaments" replace />;
  }

  if (tournamentQuery.isLoading || matchesQuery.isLoading) {
    return <MatchScheduleSkeleton />;
  }

  if (
    tournamentQuery.isError ||
    matchesQuery.isError ||
    !tournamentQuery.data?.tournament ||
    !matchesQuery.data
  ) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:px-6">
        <div className="rounded-xl border border-[#f1b3b3] bg-[#fff7f7] p-6 text-sm text-[#a02626]">
          {getErrorMessage(tournamentQuery.error ?? matchesQuery.error) ?? t("tournaments.matchesLoadError")}
        </div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to={`/tournaments/${id}?tab=matches`}>{t("tournaments.goBack")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tournament = tournamentQuery.data.tournament;
  const allMatches = matchesQuery.data.matches;
  const scheduleMeta = matchesQuery.data.schedule;
  const canEditScores = tournament.permissions.canEdit;

  const view = buildMatchSchedulePageModel(
    searchParams,
    allMatches,
    scheduleMeta.currentRound,
    scheduleMeta.totalRounds,
    tournament.totalRounds,
    matchesQuery.isFetching
  );

  const dateLocale: Locale = getDateFnsLocale(i18n.language) ?? enUS;

  const closeEditor = () => {
    setEditingMatch(null);
    setScoreRows([]);
  };

  const openEditor = (match: TournamentScheduleMatch) => {
    setEditingMatch(match);
    setScoreRows(createScoreEditorRows(match));
  };

  const updateScoreSetRow = (
    rowId: string,
    side: "playerOne" | "playerTwo",
    value: string
  ) => {
    setScoreRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [side]: value,
            }
          : row
      )
    );
  };

  const persistEditedScore = async (): Promise<boolean> => {
    if (!editingMatch) {
      return true;
    }

    const payload = buildScorePayload(scoreRows, editingMatch.playMode, t);
    if (!payload.ok) {
      toast.error(payload.message ?? t("tournaments.scoreEditorIncomplete"));
      return false;
    }

    try {
      await recordScoreMutation.mutateAsync({
        tournamentId: tournament.id,
        matchId: editingMatch.id,
        input: {
          playerOneScores: payload.playerOneScores,
          playerTwoScores: payload.playerTwoScores,
        },
      });

      toast.success(t("tournaments.scoreEditorSaveSuccess"));
      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("tournaments.liveModalScoreSaveError"));
      return false;
    }
  };

  const saveEditedScore = async () => {
    const ok = await persistEditedScore();
    if (ok) {
      closeEditor();
    }
  };

  const handleToggleInlineEdit = async (match: TournamentScheduleMatch) => {
    if (editingMatch?.id === match.id) {
      await saveEditedScore();
      return;
    }

    if (editingMatch && editingMatch.id !== match.id) {
      if (recordScoreMutation.isPending) {
        return;
      }
      const ok = await persistEditedScore();
      if (!ok) {
        return;
      }
      openEditor(match);
      return;
    }

    openEditor(match);
  };

  const handleCreateNextRound = useCallback(async () => {
    if (!id || !view.canCreateNextRound) {
      return;
    }
    if (scheduleQuery.isLoading) {
      return;
    }
    if (!scheduleQuery.data) {
      toast.error(getErrorMessage(scheduleQuery.error) ?? t("tournaments.scheduleLoadError"));
      navigate(`/tournaments/${id}/schedule?round=${view.nextRound}`);
      return;
    }

    const input = scheduleQuery.data.scheduleInput;
    const participants = normalizeParticipantRows(scheduleQuery.data.participants);
    const selectedCourtIds = input.availableCourts
      .filter((court) => court.selected)
      .map((court) => court.id);

    if (
      selectedCourtIds.length === 0 ||
      !canGenerateSchedule(input.mode, participants.length)
    ) {
      navigate(`/tournaments/${id}/schedule?round=${view.nextRound}`);
      return;
    }

    const bounds = resolveTournamentScheduleTimeBounds(tournament.startTime, tournament.endTime);
    const clampedStartTime = clampTime24ToBounds(input.startTime, bounds);

    try {
      const response = await generateScheduleMutation.mutateAsync({
        id,
        payload: {
          round: view.nextRound,
          mode: input.mode,
          matchesPerPlayer: input.matchesPerPlayer,
          startTime: clampedStartTime,
          courtIds: selectedCourtIds,
          participantOrder: participantOrderIds(participants),
          ...(tournament.tournamentMode === "singleDay"
            ? {
                matchDurationMinutes: input.matchDurationMinutes ?? 60,
                breakTimeMinutes: input.breakTimeMinutes ?? 5,
              }
            : {}),
        },
      });

      toast.success(t("tournaments.scheduleGenerated", { round: response.schedule.round }));
      navigate(`/tournaments/${id}/match-schedule?round=${response.schedule.round}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("tournaments.scheduleGenerateError"));
    }
  }, [
    generateScheduleMutation,
    id,
    navigate,
    scheduleQuery.data,
    scheduleQuery.error,
    scheduleQuery.isLoading,
    t,
    tournament,
    view.canCreateNextRound,
    view.nextRound,
  ]);

  const nextRoundDisabledMessage =
    view.nextRoundDisabledHint != null
      ? view.nextRoundDisabledHint.reason === "missing"
        ? t("tournaments.schedulePreviousRoundMissing", {
            round: view.nextRoundDisabledHint.round,
          })
        : t("tournaments.schedulePreviousRoundIncomplete", {
            round: view.nextRoundDisabledHint.round,
          })
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:px-6">
      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-4 py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tournaments/${id}?tab=matches`)}
              className="h-auto w-auto shrink-0 p-0 text-[#010a04] hover:bg-transparent"
            >
              <ChevronLeft size={20} className="text-[#010a04]" />
            </Button>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 text-[20px] font-semibold leading-tight tracking-tight text-[#010a04] sm:text-[22px] lg:text-[24px]">
                {t("tournaments.matchScheduleTitle")}
              </h1>
              <span
                className="inline-flex shrink-0 items-center rounded-md border border-[#010a04]/10 bg-[#f4f6f8] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[#010a04]/80"
                title={t("tournaments.roundNumber", { round: view.selectedRound })}
                aria-label={t("tournaments.roundNumber", { round: view.selectedRound })}
              >
                R{view.selectedRound}
              </span>
            </div>
          </div>
          {canEditScores ? (
            view.hasReachedFinalRound ? (
              <Button
                type="button"
                onClick={() => navigate(`/tournaments/${id}?tab=results`)}
                className="h-[34px] shrink-0 rounded-[8px] bg-[#111827] px-3 text-[13px] font-medium text-white hover:bg-black sm:px-4"
              >
                {t("tournaments.viewResults")}
              </Button>
            ) : (
              <div className="flex max-w-[min(100%,18rem)] flex-col items-end gap-1">
                <Button
                  type="button"
                  onClick={() => void handleCreateNextRound()}
                  disabled={
                    !view.canCreateNextRound ||
                    generateScheduleMutation.isPending ||
                    scheduleQuery.isLoading
                  }
                  aria-describedby={
                    !view.canCreateNextRound && nextRoundDisabledMessage
                      ? nextRoundHintId
                      : undefined
                  }
                  className="h-[34px] shrink-0 gap-1.5 rounded-[8px] bg-[#067429] px-3 text-[13px] font-medium text-white hover:bg-[#055d21] sm:px-4"
                >
                  <IconPlus size={16} className="text-white" aria-hidden />
                  {t("tournaments.newRound")}
                </Button>
                {!view.canCreateNextRound && nextRoundDisabledMessage ? (
                  <p id={nextRoundHintId} className="text-right text-[11px] leading-snug text-[#6b7280]">
                    {nextRoundDisabledMessage}
                  </p>
                ) : null}
              </div>
            )
          ) : null}
        </div>

        {view.showRoundLoadingSkeleton ? (
          <div
            className="grid gap-3 lg:grid-cols-2"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only">{t("tournaments.matchScheduleLoadingRound")}</span>
            {Array.from({ length: 4 }, (_, index) => (
              <article
                key={`round-loading-skeleton-${index}`}
                className="animate-skeleton-soft rounded-[12px] border border-[#010a04]/10 bg-[#f8faf9] p-4"
              >
                <div className="mb-4 h-4 w-2/3 rounded bg-[#010a04]/10" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-5 w-32 rounded bg-[#010a04]/10" />
                    <div className="h-8 w-40 rounded bg-[#010a04]/10" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-5 w-28 rounded bg-[#010a04]/10" />
                    <div className="h-8 w-40 rounded bg-[#010a04]/10" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : view.roundMatches.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#d1d5db] bg-[#f9fafc] p-8 text-sm text-[#6b7280]">
            {t("tournaments.noMatchesAvailable")}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {view.roundMatches.map((match) => (
              <MatchScheduleCard
                key={match.id}
                match={match}
                locale={dateLocale}
                t={t}
                canEditScores={canEditScores}
                isEditing={editingMatch?.id === match.id}
                editableRows={editingMatch?.id === match.id ? scoreRows : []}
                isMutationPending={recordScoreMutation.isPending}
                onToggleEdit={handleToggleInlineEdit}
                onScoreInputChange={updateScoreSetRow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
