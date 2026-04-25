import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft } from "@/icons/figma-icons";
import { getErrorMessage } from "@/lib/errors";
import { TournamentScheduleConfigCard } from "./components/TournamentScheduleConfigCard";
import { TournamentScheduleParticipantsCard } from "./components/TournamentScheduleParticipantsCard";
import { TournamentSchedulePageSkeleton } from "./components/TournamentSchedulePageSkeleton";
import { useTournamentSchedulePageController } from "./hooks/useTournamentSchedulePageController";

export default function TournamentSchedulePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const controller = useTournamentSchedulePageController({
    id: id ?? null,
    searchParams,
  });

  if (!id) {
    return <Navigate to="/tournaments" replace />;
  }

  if (controller.tournamentDetailQuery.isLoading) {
    return <TournamentSchedulePageSkeleton t={t} />;
  }

  if (
    controller.tournamentDetailQuery.isError ||
    !controller.tournamentDetailQuery.data?.tournament
  ) {
    return <Navigate to={`/tournaments/${id}`} replace />;
  }

  const tournament = controller.tournamentDetailQuery.data.tournament;
  if (!tournament.permissions.canEdit) {
    return <Navigate to={`/tournaments/${id}`} replace />;
  }

  const enrolled = tournament.participants.length;
  if (enrolled < tournament.minMember) {
    return (
      <Navigate
        to={`/tournaments/${id}?tab=matches`}
        replace
        state={{
          toast: {
            key: "tournaments.scheduleMinPlayersNotMet",
            values: {
              min: tournament.minMember,
              current: enrolled,
            },
          },
        }}
      />
    );
  }

  if (controller.scheduleQuery.isLoading) {
    return <TournamentSchedulePageSkeleton t={t} />;
  }

  if (controller.scheduleQuery.isError || !controller.scheduleQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        <div className="rounded-xl border border-[#f1b3b3] bg-[#fff7f7] p-6 text-sm text-[#a02626]">
          {getErrorMessage(controller.scheduleQuery.error) ?? t("tournaments.scheduleLoadError")}
        </div>
        <div>
          <Button asChild variant="outline">
            <Link to={`/tournaments/${id}?tab=matches`}>{t("tournaments.goBack")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 bg-[#f8fbf8] px-4 pb-10 pt-6 sm:max-w-6xl sm:bg-transparent sm:px-6 sm:pt-8">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="group h-auto w-fit gap-1.5 px-1 text-[14px] font-medium text-[#010a04]/70 hover:bg-transparent hover:text-[#010a04]"
        >
          <Link to={`/tournaments/${id}?tab=matches`}>
            <ChevronLeft size={16} className="text-[#010a04]/70 group-hover:text-[#010a04]" />
            {t("tournaments.goBack")}
          </Link>
        </Button>
      </div>

      <TournamentScheduleConfigCard
        tournamentName={controller.scheduleQuery.data.tournament.name}
        isScheduledTournament={controller.isScheduledTournament}
        matchDurationMinutes={controller.matchDurationMinutes}
        breakTimeMinutes={controller.breakTimeMinutes}
        matchesPerPlayer={controller.matchesPerPlayer}
        startTime={controller.clampedStartTime}
        scheduleTimeBounds={controller.scheduleTimeBounds}
        availableCourts={controller.availableCourts}
        selectedCourtIds={controller.selectedCourtIds}
        canSubmit={controller.canSubmit}
        scheduleRoundGate={controller.scheduleRoundGate}
        isReschedulingExistingRound={controller.isReschedulingExistingRound}
        isGenerating={controller.generateScheduleMutation.isPending}
        onMatchDurationChange={controller.onMatchDurationChange}
        onBreakTimeChange={controller.onBreakTimeChange}
        onMatchesPerPlayerChange={controller.onMatchesPerPlayerChange}
        onStartTimeChange={controller.onStartTimeChange}
        onToggleCourt={controller.onToggleCourt}
        onGenerateSchedule={controller.onGenerateSchedule}
      />

      <TournamentScheduleParticipantsCard
        mode={controller.mode}
        participants={controller.participants}
        doublesPairs={controller.doublesPairs}
        doublesPairsLoading={controller.generateDoublesPairsMutation.isPending}
        onPlayingModeChange={controller.onPlayingModeChange}
        onEditParticipant={() => controller.onEditParticipant()}
        onRemoveParticipant={controller.onRemoveParticipant}
        onReorderParticipant={controller.onReorderParticipant}
      />

      <AlertDialog
        open={controller.isRescheduleWarningOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            controller.onCancelRescheduleWarning();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tournaments.scheduleRescheduleWarningTitle", {
                round: controller.round,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tournaments.scheduleRescheduleWarningDescription", {
                count: controller.scoredMatchesCount,
                round: controller.round,
                scoredMatches: controller.scoredMatchesCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={controller.generateScheduleMutation.isPending}
              onClick={controller.onCancelRescheduleWarning}
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={controller.generateScheduleMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void controller.onConfirmRescheduleWarning();
              }}
            >
              {t("tournaments.scheduleRescheduleWarningConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
