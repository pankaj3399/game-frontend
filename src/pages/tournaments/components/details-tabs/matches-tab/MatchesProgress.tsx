import type { TFunction } from "i18next";
import type { MatchCounts } from "./types";

interface MatchesProgressProps {
  counts: MatchCounts;
  total: number;
  /** Display round for the progress header (from tournament/match schedule). */
  currentRound: number;
  t: TFunction;
}

export function MatchesProgress({ counts, total, currentRound, t }: MatchesProgressProps) {
  const clampedProgress = Math.max(0, Math.min(100, counts.progressPct));

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">
          {t("tournaments.tournamentProgressRound", { round: currentRound })}
        </h3>
        <p className="text-xs text-[#9ca3af]">
          {t("tournaments.matchesCompletedCount", { completed: counts.completedCount, total })}
        </p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-[#f3f4f6]">
        <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${clampedProgress}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-[#15803d]">
          <span className="size-2 rounded-full bg-[#16a34a]" />
          {t("tournaments.completedCount", { completed: counts.completedCount })}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-[#1d4ed8]">
          <span className="size-2 rounded-full bg-[#2563eb]" />
          {t("tournaments.inProgressCount", { inProgress: counts.inProgressCount })}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-[#6b7280]">
          <span className="size-2 rounded-full bg-[#9ca3af]" />
          {t("tournaments.scheduledCount", { scheduled: counts.scheduledCount })}
        </span>
      </div>
    </div>
  );
}
