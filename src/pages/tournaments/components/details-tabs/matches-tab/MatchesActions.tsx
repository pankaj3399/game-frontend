import { Button } from "@/components/ui/button";
import type { TFunction } from "i18next";
import { toast } from "sonner";

interface MatchesActionsProps {
  t: TFunction;
  round: number;
  canSchedule: boolean;
}

export function MatchesActions({ t, round, canSchedule }: MatchesActionsProps) {
  if (!canSchedule) {
    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={() => toast.info(t("common.comingSoon"))}
        className="h-9 rounded-md bg-[#111827] px-4 text-sm font-medium text-white hover:bg-black"
      >
        {t("tournaments.scheduleGamesRound", { round })}
      </Button>
    </div>
  );
}
