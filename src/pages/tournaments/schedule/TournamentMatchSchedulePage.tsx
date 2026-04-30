import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import RescheduleWarningDialog from "@/pages/tournaments/schedule/components/RescheduleWarningDialog";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { queryKeys } from "@/lib/api/queryKeys";
import { ChevronLeft, IconPlus } from "@/icons/figma-icons";
import {
  useGenerateTournamentSchedule,
  useTournamentSchedule,
  useTournamentById,
  useTournamentMatches,
} from "@/pages/tournaments/hooks";
import useMatchEditor from "@/pages/tournaments/schedule/hooks/useMatchEditor";
import usePersistMatchScore from "@/pages/tournaments/schedule/hooks/usePersistMatchScore";
import type {
  TournamentMatchesResponse,
  TournamentScheduleMatch,
  GenerateTournamentScheduleInput,
} from "@/models/tournament/types";
import { MatchScheduleCard } from "@/pages/tournaments/schedule/components/MatchScheduleCard";
import { buildMatchSchedulePageModel } from "@/pages/tournaments/schedule/utils/matchScheduleViewModel";
import { pickLatestMatchesData } from "@/pages/tournaments/schedule/utils/pickLatestMatchesData";
// score row type is internal to editor hook; not needed here
import { capCourtsForParticipants } from "@/pages/tournaments/schedule/helpers/scheduleParticipants";
import MatchScheduleSkeleton from "./components/MatchScheduleSkeleton";
import { RoundLoadingSkeleton } from "./components/RoundLoadingSkeleton";

const RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX =
  "RESCHEDULE_WITH_SCORES_CONFIRMATION_REQUIRED:";
const ESCAPED_RESCHEDULE_PREFIX = RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);
const RESCHEDULE_WITH_SCORES_CONFIRMATION_REGEX = new RegExp(
  `${ESCAPED_RESCHEDULE_PREFIX}\\s*Round\\s+(\\d+)\\s+has\\s+(\\d+)\\s+scored match`,
  "i"
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TournamentMatchSchedulePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [isCreatingNextRound, setIsCreatingNextRound] = useState(false);
  const [isRescheduleWarningOpen, setIsRescheduleWarningOpen] = useState(false);
  const [rescheduleScoredMatchesCount, setRescheduleScoredMatchesCount] = useState(0);
  const [rescheduleTargetRound, setRescheduleTargetRound] = useState<number | null>(null);
  const parsedRound = Number.parseInt(searchParams.get("round") ?? "1", 10);
  const selectedRoundFromQuery = Number.isFinite(parsedRound) && parsedRound > 0 ? parsedRound : 1;

  const i18nText = useMemo(
    () => ({
      scheduleGenerateError: t("tournaments.scheduleGenerateError"),
      matchesLoadError: t("tournaments.matchesLoadError"),
      goBack: t("tournaments.goBack"),
      matchScheduleTitle: t("tournaments.matchScheduleTitle"),
      viewResults: t("tournaments.viewResults"),
      rescheduleConfirm: t("tournaments.scheduleRescheduleWarningConfirm"),
      newRound: t("tournaments.newRound"),
      noMatchesAvailable: t("tournaments.noMatchesAvailable"),
      matchesRefreshErrorAfterSave: t("tournaments.matchesRefreshErrorAfterSave"),
    }),
    [t]
  );

  const queryClient = useQueryClient();
  const tournamentQuery = useTournamentById(id ?? null, Boolean(id));
  const matchesQuery = useTournamentMatches(id ?? null, Boolean(id));
  const scheduleQuery = useTournamentSchedule(id ?? null, Boolean(id));
  const generateScheduleMutation = useGenerateTournamentSchedule();
  const tournamentMode = tournamentQuery.data?.tournament?.tournamentMode;
  const tournamentDuration = tournamentQuery.data?.tournament?.duration;
  const tournamentBreakDuration = tournamentQuery.data?.tournament?.breakDuration;

  const persistHook = usePersistMatchScore({
    tournament: tournamentQuery.data?.tournament,
    matchesQuery,
    t,
  });

  const { persistMatchScore, isPersisting, savingMatchId, saveErrorsByMatchId } = persistHook;

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
  
  const parseBackendRescheduleConfirmation = useCallback(
    (message: string): { round: number; scoredMatches: number } | null => {
      const match = message.match(RESCHEDULE_WITH_SCORES_CONFIRMATION_REGEX);
      if (!match) return null;
      return {
        round: Number.parseInt(match[1], 10),
        scoredMatches: Number.parseInt(match[2], 10),
      };
    },
    []
  );

  const buildReschedulePayload = useCallback(
    (allowRescheduleWithScores: boolean, roundOverride?: number): GenerateTournamentScheduleInput | null => {
      const scheduleInput = scheduleQuery.data?.scheduleInput;
      const participants = scheduleQuery.data?.participants ?? [];
      if (!scheduleInput || participants.length === 0) return null;

      const round = roundOverride ?? 1;

      const selectedCourtIds = (scheduleInput.availableCourts ?? [])
        .filter((c) => c.selected)
        .map((c) => c.id);

      const effectiveCourtIds = capCourtsForParticipants(
        selectedCourtIds,
        scheduleInput.mode,
        participants.length
      );

      if (effectiveCourtIds.length < 1) {
        return null;
      }

      const participantOrder = participants
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((p) => p.id);

      if (participantOrder.length < 2) {
        return null;
      }

      return {
        round,
        mode: scheduleInput.mode,
        matchesPerPlayer: scheduleInput.matchesPerPlayer,
        startTime: scheduleInput.startTime,
        courtIds: effectiveCourtIds,
        participantOrder,
        ...(tournamentMode === "singleDay"
          ? {
              matchDurationMinutes: scheduleInput.matchDurationMinutes ?? tournamentDuration ?? 60,
              breakTimeMinutes: scheduleInput.breakTimeMinutes ?? tournamentBreakDuration ?? 5,
            }
          : {}),
        allowRescheduleWithScores,
      };
    },
    [scheduleQuery.data, tournamentBreakDuration, tournamentDuration, tournamentMode]
  );

  const onCancelRescheduleWarning = useCallback(() => {
    setIsRescheduleWarningOpen(false);
    setRescheduleScoredMatchesCount(0);
    setRescheduleTargetRound(null);
  }, []);

  const syncTournamentStateAfterReschedule = useCallback(
    async (tournamentId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tournament.schedule(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tournament.matches(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(tournamentId) }),
      ]);
    },
    [queryClient]
  );

  const onConfirmRescheduleWarning = useCallback(async () => {
    if (!id) return;
    const round = rescheduleTargetRound ?? selectedRoundFromQuery;
    const payload = buildReschedulePayload(true, round);
    if (!payload) {
      toast.error(i18nText.scheduleGenerateError);
      onCancelRescheduleWarning();
      return;
    }

    try {
      await generateScheduleMutation.mutateAsync({ id, payload });
      await syncTournamentStateAfterReschedule(id);
      setIsRescheduleWarningOpen(false);
      setRescheduleTargetRound(null);
      toast.success(t("tournaments.scheduleGenerated", { round: payload.round }));
      navigate(`/tournaments/${id}/match-schedule?round=${payload.round}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? i18nText.scheduleGenerateError);
    }
  }, [
    buildReschedulePayload,
    generateScheduleMutation,
    i18nText.scheduleGenerateError,
    id,
    navigate,
    onCancelRescheduleWarning,
    rescheduleTargetRound,
    syncTournamentStateAfterReschedule,
    t,
    selectedRoundFromQuery,
  ]);

  const onStartReschedule = useCallback(async () => {
    if (!id) return;
    const round = selectedRoundFromQuery;
    const payload = buildReschedulePayload(false, round);
    if (!payload || payload.participantOrder.length < 2) {
      toast.error(i18nText.scheduleGenerateError);
      return;
    }

    setRescheduleTargetRound(round);
    setIsRescheduleWarningOpen(false);
    try {
      await generateScheduleMutation.mutateAsync({ id, payload });
      await syncTournamentStateAfterReschedule(id);
      toast.success(t("tournaments.scheduleGenerated", { round }));
      navigate(`/tournaments/${id}/match-schedule?round=${round}`);
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? "";
      const parsed = parseBackendRescheduleConfirmation(message);
      if (
        message.startsWith(RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX) &&
        parsed &&
        parsed.round === round
      ) {
        setRescheduleScoredMatchesCount(parsed.scoredMatches);
        setIsRescheduleWarningOpen(true);
        return;
      }

      toast.error(getErrorMessage(error) ?? i18nText.scheduleGenerateError);
    }
  }, [
    buildReschedulePayload,
    generateScheduleMutation,
    i18nText.scheduleGenerateError,
    id,
    navigate,
    parseBackendRescheduleConfirmation,
    syncTournamentStateAfterReschedule,
    t,
    selectedRoundFromQuery,
  ]);

  if (!id) return <Navigate to="/tournaments" replace />;
  if (tournamentQuery.isLoading || matchesQuery.isLoading) return <MatchScheduleSkeleton />;

  if (
    tournamentQuery.isError ||
    matchesQuery.isError ||
    !tournamentQuery.data?.tournament ||
    !matchesQuery.data
  ) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6">
        <div className="rounded-[12px] border border-[#f1b3b3] bg-[#fff7f7] px-5 py-4 text-sm text-[#a02626]">
          {getErrorMessage(tournamentQuery.error ?? matchesQuery.error) ?? i18nText.matchesLoadError}
        </div>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link to={`/tournaments/${id}?tab=matches`}>{i18nText.goBack}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tournament = tournamentQuery.data.tournament;
  const canEditScores = tournament.permissions.canEdit;
  const dateLocale: Locale = getDateFnsLocale(i18n.language) ?? enUS;

  const view = buildMatchSchedulePageModel(
    searchParams,
    matchesQuery.data.matches,
    matchesQuery.data.schedule.currentRound,
    matchesQuery.data.schedule.totalRounds,
    tournament.totalRounds,
    matchesQuery.isFetching
  );


  const canRescheduleThisRound =
    canEditScores &&
    view.roundMatches.length > 0 &&
    scheduleQuery.data != null &&
    !scheduleQuery.isError;

  
  // Persistence is handled via `usePersistMatchScore` and `useMatchEditor` callbacks.

  const handleToggleInlineEdit = async (match: TournamentScheduleMatch) => {
    if (isCreatingNextRound) return;
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

  const handleCreateNextRound = async () => {
    if (!id || isCreatingNextRound) return;
    setIsCreatingNextRound(true);
    try {
      let effectiveView = view;
      let isRoundDataStale = false;
      if (editingMatch) {
        const saveResult = await persistMatchScore(editingMatch, scoreRows, false);
        if (!saveResult.ok) return;
        closeEditor();
        let latestMatchesData = saveResult.latestData;
        try {
          const refreshed = await matchesQuery.refetch();
          latestMatchesData = pickLatestMatchesData({
            refetchData: refreshed.data,
            mutationResult: saveResult.mutationResult,
            cacheData:
              queryClient.getQueryData<TournamentMatchesResponse>(
                queryKeys.tournament.matches(tournament.id)
              ) ?? matchesQuery.data,
          });
        } catch {
          isRoundDataStale = true;
          latestMatchesData = undefined;
          toast.error(i18nText.matchesRefreshErrorAfterSave);
        }
        if (!isRoundDataStale && latestMatchesData) {
          effectiveView = buildMatchSchedulePageModel(
            searchParams,
            latestMatchesData.matches,
            latestMatchesData.schedule.currentRound,
            latestMatchesData.schedule.totalRounds,
            tournament.totalRounds,
            matchesQuery.isFetching
          );
        } else if (isRoundDataStale) {
          console.error("[TournamentMatchSchedulePage] Failed to refetch after score save.", {
            tournamentId: tournament.id,
            search: searchParams.toString(),
            reason: "stale data after refetch failure",
          });
        }
      }
      const canCreateNextRound = !isRoundDataStale && effectiveView.canCreateNextRound;
      if (!canCreateNextRound) {
        if (isRoundDataStale) {
          return;
        }
        const hint = effectiveView.nextRoundDisabledHint;
        const msg = hint != null
          ? hint.reason === "missing"
            ? t("tournaments.schedulePreviousRoundMissing", { round: hint.round })
            : t("tournaments.schedulePreviousRoundIncomplete", { round: hint.round })
          : null;
        if (msg) toast.error(msg);
        return;
      }
      navigate(`/tournaments/${id}/schedule?round=${effectiveView.nextRound}`);
    } finally {
      setIsCreatingNextRound(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6">
      <RescheduleWarningDialog
        open={isRescheduleWarningOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onCancelRescheduleWarning();
        }}
        round={rescheduleTargetRound ?? view.selectedRound}
        scoredMatches={rescheduleScoredMatchesCount}
        isPending={generateScheduleMutation.isPending}
        onCancel={onCancelRescheduleWarning}
        onConfirm={() => void onConfirmRescheduleWarning()}
        t={t}
      />

      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={i18nText.goBack}
          onClick={() => navigate(`/tournaments/${id}?tab=matches`)}
          className="h-8 w-8 shrink-0 rounded-[8px] border border-[#010a04]/[0.10] bg-white p-0 text-[#010a04] shadow-none hover:bg-[#010a04]/[0.04]"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="min-w-0 text-[18px] font-semibold leading-tight tracking-tight text-[#010a04] sm:text-[20px]">
            {i18nText.matchScheduleTitle}
          </h1>
          <span
            className="inline-flex shrink-0 items-center rounded-[6px] border border-[#010a04]/[0.09] bg-[#010a04]/[0.04] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#010a04]/55"
            aria-label={t("tournaments.roundNumber", { round: view.selectedRound })}
          >
            R{view.selectedRound}
          </span>
        </div>

        {canEditScores && (
          <div className="flex shrink-0 items-center gap-2">
            {view.hasReachedFinalRound ? (
              <Button
                type="button"
                onClick={() => navigate(`/tournaments/${id}?tab=results`)}
                className="h-[34px] rounded-[8px] bg-[#111827] px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-black"
              >
                {i18nText.viewResults}
              </Button>
            ) : (
              <>
                {canRescheduleThisRound ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onStartReschedule()}
                    disabled={
                      generateScheduleMutation.isPending ||
                      isCreatingNextRound ||
                      isPersisting ||
                      savingMatchId != null ||
                      editingMatch != null
                    }
                    className="h-[34px] rounded-[8px] border border-[#010a04]/[0.12] bg-white px-3.5 text-[13px] font-medium text-[#010a04] shadow-none hover:bg-[#010a04]/[0.04]"
                  >
                    {i18nText.rescheduleConfirm}
                  </Button>
                ) : null}

                <Button
                  type="button"
                  onClick={() => void handleCreateNextRound()}
                  disabled={isCreatingNextRound || isPersisting || savingMatchId != null}
                  className="h-[34px] gap-1.5 rounded-[8px] bg-[#067429] px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-[#055d21]"
                >
                  <IconPlus size={14} className="text-white" aria-hidden />
                  {i18nText.newRound}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Match grid */}
      {view.showRoundLoadingSkeleton ? (
        <RoundLoadingSkeleton />
      ) : view.roundMatches.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#010a04]/[0.12] bg-[#010a04]/[0.02] p-10 text-center text-[13px] text-[#010a04]/40">
          {i18nText.noMatchesAvailable}
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
              isSavePending={savingMatchId === match.id}
              saveErrorMessage={saveErrorsByMatchId[match.id] ?? null}
              onToggleEdit={handleToggleInlineEdit}
              onScoreInputChange={updateScoreSetRow}
            />
          ))}
        </div>
      )}
    </div>
  );
}
