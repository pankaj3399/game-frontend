import { Button } from "@/components/ui/button";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router-dom";

interface MatchesActionsProps {
  t: TFunction;
  round: number;
  canSchedule: boolean;
  tournamentId: string;
}

export function MatchesActions({ t, round, canSchedule, tournamentId }: MatchesActionsProps) {
  const navigate = useNavigate();

  if (!canSchedule) {
    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={() => navigate(`/tournaments/${tournamentId}/schedule?round=${round}`)}
        className="h-9 rounded-md bg-[#111827] px-4 text-sm font-medium text-white hover:bg-black"
      >
        {t("tournaments.scheduleGamesRound", { round })}
      </Button>
    </div>
  );
}
