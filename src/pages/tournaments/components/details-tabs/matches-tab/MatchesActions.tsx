import type { TFunction } from "i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface MatchesActionsProps {
  t: TFunction;
  round: number;
  tournamentId: string;
  canEdit: boolean;
  hasGeneratedSchedule: boolean;
  nextRoundToGenerate: number | null;
  minTournamentMembers: number;
  enrolledParticipantCount: number;
}

export function MatchesActions({
  t,
  round,
  tournamentId,
  canEdit,
  hasGeneratedSchedule,
  nextRoundToGenerate,
  minTournamentMembers,
  enrolledParticipantCount,
}: MatchesActionsProps) {
  const navigate = useNavigate();

  if (!hasGeneratedSchedule && !canEdit) {
    return null;
  }

  const shouldCreateFirstRound = !hasGeneratedSchedule && canEdit;
  const shouldCreateNextRound = nextRoundToGenerate != null && canEdit;
  const showScheduleInputButton = shouldCreateFirstRound || shouldCreateNextRound;

  const meetsMemberMinimum = enrolledParticipantCount >= minTournamentMembers;
  const blockScheduleInput = showScheduleInputButton && !meetsMemberMinimum;

  const viewSchedulePath = `/tournaments/${tournamentId}/match-schedule?round=${Math.max(1, round)}`;

  let scheduleInputPath = "";
  let scheduleInputLabel = "";
  if (shouldCreateNextRound) {
    scheduleInputPath = `/tournaments/${tournamentId}/schedule?round=${nextRoundToGenerate}`;
    scheduleInputLabel = t("tournaments.scheduleGamesRound", { round: nextRoundToGenerate });
  } else if (shouldCreateFirstRound) {
    scheduleInputPath = `/tournaments/${tournamentId}/schedule?round=1`;
    scheduleInputLabel = t("tournaments.scheduleGamesRound", { round: 1 });
  }

  const onScheduleInputClick = () => {
    if (blockScheduleInput) {
      toast.warning(
        t("tournaments.scheduleMinPlayersNotMet", {
          min: minTournamentMembers,
          current: enrolledParticipantCount,
        }),
        { id: "tournaments-schedule-min-players" }
      );
      return;
    }
    navigate(scheduleInputPath);
  };

  /** Match grid exists — organizers and viewers can open the match schedule page. */
  const showViewSchedule = hasGeneratedSchedule;

  return (
    <div className="flex w-full justify-end">
      <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center">
        {showViewSchedule ? (
          <Button
            type="button"
            variant={showScheduleInputButton ? "outline" : "default"}
            onClick={() => navigate(viewSchedulePath)}
            className={cn(
              "h-auto min-h-9 w-full justify-center whitespace-normal px-4 py-2 text-center text-sm font-medium sm:w-auto sm:whitespace-nowrap",
              showScheduleInputButton
                ? "border-[#010a04]/20 text-[#010a04] hover:bg-[#010a04]/5"
                : "bg-[#111827] text-white hover:bg-black"
            )}
          >
            {t("tournaments.viewSchedule")}
          </Button>
        ) : null}

        {showScheduleInputButton ? (
          <Button
            type="button"
            onClick={onScheduleInputClick}
            aria-disabled={blockScheduleInput}
            className={cn(
              "h-auto min-h-9 w-full justify-center whitespace-normal rounded-md bg-[#111827] px-4 py-2 text-center text-sm font-medium text-white hover:bg-black sm:w-auto sm:whitespace-nowrap",
              blockScheduleInput && "cursor-not-allowed opacity-60 hover:bg-[#111827]"
            )}
          >
            {scheduleInputLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
