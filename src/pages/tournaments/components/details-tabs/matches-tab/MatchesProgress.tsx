import type { TFunction } from "i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MatchCounts } from "./types";

export type OrganiserRoundFilter = "all" | number;

interface MatchesProgressProps {
  counts: MatchCounts;
  total: number;
  roundFilter: OrganiserRoundFilter;
  availableRounds: readonly number[];
  onRoundFilterChange: (next: OrganiserRoundFilter) => void;
  t: TFunction;
}

export function MatchesProgress({
  counts,
  total,
  roundFilter,
  availableRounds,
  onRoundFilterChange,
  t,
}: MatchesProgressProps) {
  const clampedProgress = Math.max(0, Math.min(100, counts.progressPct));

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <h3 className="min-w-0 text-[15px] font-semibold leading-tight text-[#111827] sm:text-base">
          {t("tournaments.matchesProgressTitle")}
        </h3>
        {availableRounds.length > 0 ? (
          <Select
            value={roundFilter === "all" ? "all" : String(roundFilter)}
            onValueChange={(value) =>
              onRoundFilterChange(value === "all" ? "all" : Number.parseInt(value, 10))
            }
          >
            <SelectTrigger
              aria-label={t("tournaments.matchesRoundFilterAria")}
              className={cn(
                "h-auto w-auto max-w-full rounded-md border border-[#010a04]/[0.06] bg-[#f4f6f8] px-1.5 py-0.5 text-xs text-[#374151] shadow-none hover:border-[#010a04]/12 hover:bg-[#eef1f4] focus-visible:border-[#067429]/40 focus-visible:bg-[#067429]/[0.08] focus-visible:ring-0"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              sideOffset={6}
              className="max-h-64 min-w-[10rem] max-w-[16rem] border-[#e5e7eb] p-1 shadow-sm"
            >
              <SelectItem value="all">{t("tournaments.matchesProgressFilterAll")}</SelectItem>
              {availableRounds.map((round) => (
                <SelectItem key={round} value={String(round)}>
                  {t("tournaments.roundNumber", { round })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-[#f3f4f6] pt-4">
        <p className="text-sm font-medium tabular-nums text-[#374151]">
          {t("tournaments.matchesCompletedCount", { completed: counts.completedCount, total })}
        </p>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            clampedProgress >= 100 ? "text-[#15803d]" : "text-[#6b7280]"
          )}
        >
          {total > 0 ? `${clampedProgress}%` : "—"}
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-[#f3f4f6]">
        <div
          className="h-full rounded-full bg-[#16a34a] transition-[width] duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#15803d]">
          <span className="size-2 shrink-0 rounded-full bg-[#16a34a]" />
          <span className="truncate">{t("tournaments.completedCount", { completed: counts.completedCount })}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#1d4ed8]">
          <span className="size-2 shrink-0 rounded-full bg-[#2563eb]" />
          <span className="truncate">{t("tournaments.inProgressCount", { inProgress: counts.inProgressCount })}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#b45309]">
          <span className="size-2 shrink-0 rounded-full bg-[#f59e0b]" />
          <span className="truncate">{t("tournaments.pendingScoreCount", { pendingScore: counts.pendingScoreCount })}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#6b7280]">
          <span className="size-2 shrink-0 rounded-full bg-[#9ca3af]" />
          <span className="truncate">{t("tournaments.scheduledCount", { scheduled: counts.scheduledCount })}</span>
        </span>
        {counts.cancelledCount > 0 ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#be123c]">
            <span className="size-2 shrink-0 rounded-full bg-[#f43f5e]" />
            <span className="truncate">{t("tournaments.cancelledCount", { cancelled: counts.cancelledCount })}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
