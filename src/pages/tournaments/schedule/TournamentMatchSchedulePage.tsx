import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { ChevronLeft, IconPlus } from "@/icons/figma-icons";
import {
  useRecordTournamentMatchScore,
  useTournamentById,
  useTournamentMatches,
} from "@/pages/tournaments/hooks";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { MatchScheduleCard } from "@/pages/tournaments/schedule/components/MatchScheduleCard";
import { buildMatchSchedulePageModel } from "@/pages/tournaments/schedule/utils/matchScheduleViewModel";
import {
  applyScoreInputChange,
  buildScorePayload,
  createScoreEditorRows,
  type ScoreEditorRow,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function MatchScheduleSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("common.loading")}</span>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-[8px] bg-[#010a04]/[0.07]" />
        <div className="h-6 w-44 animate-pulse rounded-md bg-[#010a04]/[0.07]" />
        <div className="h-5 w-8 animate-pulse rounded-md bg-[#010a04]/[0.07]" />
        <div className="ml-auto h-[34px] w-28 animate-pulse rounded-[8px] bg-[#010a04]/[0.07]" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[14px] border border-[#010a04]/[0.06] bg-[#010a04]/[0.03] p-4">
            <div className="mb-3 flex gap-3">
              <div className="h-3.5 w-20 animate-pulse rounded bg-[#010a04]/[0.07]" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-[#010a04]/[0.07]" />
              <div className="h-3.5 w-14 animate-pulse rounded bg-[#010a04]/[0.07]" />
            </div>
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-16 animate-pulse rounded-full bg-[#010a04]/[0.07]" />
              <div className="h-7 w-20 animate-pulse rounded-[7px] bg-[#010a04]/[0.07]" />
            </div>
            <div className="flex flex-col gap-0.5">
              {[0, 1].map((j) => (
                <div key={j} className="flex items-center justify-between rounded-[10px] bg-[#010a04]/[0.035] px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 animate-pulse rounded-full bg-[#010a04]/[0.07]" />
                    <div className="h-4 w-28 animate-pulse rounded bg-[#010a04]/[0.07]" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-[30px] w-8 animate-pulse rounded-[6px] bg-[#010a04]/[0.07]" />
                    <div className="h-[30px] w-8 animate-pulse rounded-[6px] bg-[#010a04]/[0.07]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundLoadingSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 lg:grid-cols-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("tournaments.matchScheduleLoadingRound")}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-[14px] border border-[#010a04]/[0.06] bg-[#010a04]/[0.03] p-4">
          <div className="mb-3 flex gap-3">
            <div className="h-3.5 w-20 animate-pulse rounded bg-[#010a04]/[0.07]" />
            <div className="h-3.5 w-16 animate-pulse rounded bg-[#010a04]/[0.07]" />
            <div className="h-3.5 w-14 animate-pulse rounded bg-[#010a04]/[0.07]" />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <div className="h-5 w-14 animate-pulse rounded-full bg-[#010a04]/[0.07]" />
            <div className="h-7 w-20 animate-pulse rounded-[7px] bg-[#010a04]/[0.07]" />
          </div>
          <div className="flex flex-col gap-0.5">
            {[0, 1].map((j) => (
              <div key={j} className="flex items-center justify-between rounded-[10px] bg-[#010a04]/[0.035] px-2.5 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 animate-pulse rounded-full bg-[#010a04]/[0.07]" />
                  <div className="h-4 w-24 animate-pulse rounded bg-[#010a04]/[0.07]" />
                </div>
                <div className="flex gap-1">
                  <div className="h-[30px] w-8 animate-pulse rounded-[6px] bg-[#010a04]/[0.07]" />
                  <div className="h-[30px] w-8 animate-pulse rounded-[6px] bg-[#010a04]/[0.07]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TournamentMatchSchedulePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [editingMatch, setEditingMatch] = useState<TournamentScheduleMatch | null>(null);
  const [scoreRows, setScoreRows] = useState<ScoreEditorRow[]>([]);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [saveErrorsByMatchId, setSaveErrorsByMatchId] = useState<Record<string, string>>({});
  const [isCreatingNextRound, setIsCreatingNextRound] = useState(false);

  const tournamentQuery = useTournamentById(id ?? null, Boolean(id));
  const matchesQuery = useTournamentMatches(id ?? null, Boolean(id));
  const recordScoreMutation = useRecordTournamentMatchScore();

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
          {getErrorMessage(tournamentQuery.error ?? matchesQuery.error) ?? t("tournaments.matchesLoadError")}
        </div>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link to={`/tournaments/${id}?tab=matches`}>{t("tournaments.goBack")}</Link>
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

  const closeEditor = () => {
    setEditingMatch(null);
    setScoreRows([]);
  };

  const openEditor = (match: TournamentScheduleMatch) => {
    setEditingMatch(match);
    setScoreRows(createScoreEditorRows(match));
    setSaveErrorsByMatchId((prev) => {
      if (!prev[match.id]) return prev;
      const rest = { ...prev };
      delete rest[match.id];
      return rest;
    });
  };

  const updateScoreSetRow = (
    rowId: string,
    side: "playerOne" | "playerTwo",
    value: string,
    setIndex: number
  ) => {
    if (!editingMatch) return;
    setScoreRows((prev) =>
      applyScoreInputChange(prev, rowId, side, value, editingMatch.playMode, setIndex)
    );
  };

  const persistEditedScore = async ({
    trackPerMatchState,
  }: {
    trackPerMatchState: boolean;
  }): Promise<boolean> => {
    if (!editingMatch) return true;
    const freshMatch = matchesQuery.data?.matches.find((m) => m.id === editingMatch.id) ?? null;
    if (!freshMatch) { toast.error(t("tournaments.matchesLoadError")); return false; }
    if (freshMatch.status === "cancelled") { toast.error(t("tournaments.matchStatusCancelled")); return false; }

    const payload = buildScorePayload(scoreRows, freshMatch.playMode, t);
    if (!payload.ok) { toast.error(payload.message ?? t("tournaments.scoreEditorIncomplete")); return false; }

    try {
      if (trackPerMatchState) {
        setSavingMatchId(freshMatch.id);
        setSaveErrorsByMatchId((prev) => {
          if (!prev[freshMatch.id]) return prev;
          const rest = { ...prev };
          delete rest[freshMatch.id];
          return rest;
        });
      }
      await recordScoreMutation.mutateAsync({
        tournamentId: tournament.id,
        matchId: freshMatch.id,
        input: { playerOneScores: payload.playerOneScores, playerTwoScores: payload.playerTwoScores },
      });
      toast.success(t("tournaments.scoreEditorSaveSuccess"));
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? t("tournaments.liveModalScoreSaveError");
      if (trackPerMatchState) setSaveErrorsByMatchId((prev) => ({ ...prev, [freshMatch.id]: message }));
      toast.error(message);
      return false;
    } finally {
      if (trackPerMatchState) setSavingMatchId((prev) => (prev === freshMatch.id ? null : prev));
    }
  };

  const saveEditedScore = async () => {
    const ok = await persistEditedScore({ trackPerMatchState: true });
    if (ok) closeEditor();
  };

  const handleToggleInlineEdit = async (match: TournamentScheduleMatch) => {
    if (isCreatingNextRound) return;
    if (editingMatch?.id === match.id) { await saveEditedScore(); return; }
    if (editingMatch && editingMatch.id !== match.id) {
      if (savingMatchId === editingMatch.id) return;
      const ok = await persistEditedScore({ trackPerMatchState: true });
      if (!ok) return;
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
      if (editingMatch) {
        const ok = await persistEditedScore({ trackPerMatchState: false });
        if (!ok) return;
        closeEditor();
        let latestMatchesData = matchesQuery.data;
        try {
          const refreshed = await matchesQuery.refetch();
          latestMatchesData = refreshed.data ?? matchesQuery.data;
        } catch (error) {
          console.error("[TournamentMatchSchedulePage] Failed to refetch after score save.", {
            tournamentId: tournament.id,
            search: searchParams.toString(),
            error,
          });
        }
        if (latestMatchesData) {
          effectiveView = buildMatchSchedulePageModel(
            searchParams,
            latestMatchesData.matches,
            latestMatchesData.schedule.currentRound,
            latestMatchesData.schedule.totalRounds,
            tournament.totalRounds,
            matchesQuery.isFetching
          );
        }
      }
      if (!effectiveView.canCreateNextRound) {
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
      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("tournaments.goBack")}
          onClick={() => navigate(`/tournaments/${id}?tab=matches`)}
          className="h-8 w-8 shrink-0 rounded-[8px] border border-[#010a04]/[0.10] bg-white p-0 text-[#010a04] shadow-none hover:bg-[#010a04]/[0.04]"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="min-w-0 text-[18px] font-semibold leading-tight tracking-tight text-[#010a04] sm:text-[20px]">
            {t("tournaments.matchScheduleTitle")}
          </h1>
          <span
            className="inline-flex shrink-0 items-center rounded-[6px] border border-[#010a04]/[0.09] bg-[#010a04]/[0.04] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#010a04]/55"
            aria-label={t("tournaments.roundNumber", { round: view.selectedRound })}
          >
            R{view.selectedRound}
          </span>
        </div>

        {canEditScores && (
          <div className="shrink-0">
            {view.hasReachedFinalRound ? (
              <Button
                type="button"
                onClick={() => navigate(`/tournaments/${id}?tab=results`)}
                className="h-[34px] rounded-[8px] bg-[#111827] px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-black"
              >
                {t("tournaments.viewResults")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleCreateNextRound()}
                disabled={isCreatingNextRound}
                className="h-[34px] gap-1.5 rounded-[8px] bg-[#067429] px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-[#055d21]"
              >
                <IconPlus size={14} className="text-white" aria-hidden />
                {t("tournaments.newRound")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Match grid */}
      {view.showRoundLoadingSkeleton ? (
        <RoundLoadingSkeleton />
      ) : view.roundMatches.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#010a04]/[0.12] bg-[#010a04]/[0.02] p-10 text-center text-[13px] text-[#010a04]/40">
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