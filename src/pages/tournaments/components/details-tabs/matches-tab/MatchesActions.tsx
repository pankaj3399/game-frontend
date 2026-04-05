import { Button } from "@/components/ui/button";
import type { TFunction } from "i18next";
import { toast } from "sonner";

interface MatchesActionsProps {
  t: TFunction;
}

export function MatchesActions({ t }: MatchesActionsProps) {
  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={() => toast.info(t("common.comingSoon"))}
        className="h-9 rounded-md bg-[#111827] px-4 text-sm font-medium text-white hover:bg-black"
      >
        {t("tournaments.scheduleGamesRound", { round: 1 })}
      </Button>
    </div>
  );
}
