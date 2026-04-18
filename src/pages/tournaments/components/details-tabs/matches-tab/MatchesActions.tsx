import { Button } from "@/components/ui/button";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router-dom";

interface MatchesActionsProps {
  t: TFunction;
  round: number;
  tournamentId: string;
  canEdit: boolean;
  hasGeneratedSchedule: boolean;
  nextRoundToGenerate: number | null;
}

export function MatchesActions({
  t,
  round,
  tournamentId,
  canEdit,
  hasGeneratedSchedule,
  nextRoundToGenerate,
}: MatchesActionsProps) {
  const navigate = useNavigate();

  if (!hasGeneratedSchedule && !canEdit) {
    return null;
  }

  const shouldCreateFirstRound = !hasGeneratedSchedule && canEdit;
  const shouldCreateNextRound = nextRoundToGenerate != null && canEdit;

  let targetPath = `/tournaments/${tournamentId}/schedule?round=${Math.max(1, round)}`;
  let label = t("tournaments.viewSchedule");

  if (shouldCreateNextRound) {
    targetPath = `/tournaments/${tournamentId}/schedule?round=${nextRoundToGenerate}`;
    label = t("tournaments.scheduleGamesRound", { round: nextRoundToGenerate });
  } else if (shouldCreateFirstRound) {
    targetPath = `/tournaments/${tournamentId}/schedule?round=1`;
    label = t("tournaments.scheduleGamesRound", { round: 1 });
  }

  return (
    <div className="flex items-center justify-end">
      <Button
        type="button"
        onClick={() => {
          navigate(targetPath);
        }}
        className="h-9 rounded-md bg-[#111827] px-4 text-sm font-medium text-white hover:bg-black"
      >
        {label}
      </Button>
    </div>
  );
}
