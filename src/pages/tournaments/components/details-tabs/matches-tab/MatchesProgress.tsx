import { useState } from "react";
import type { TFunction } from "i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "@/icons/figma-icons";
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
  const [roundMenuOpen, setRoundMenuOpen] = useState(false);

  const triggerLabel =
    roundFilter === "all"
      ? t("tournaments.matchesListAllRoundsSubtitle")
      : t("tournaments.roundNumber", { round: roundFilter });

  const pickRound = (next: OrganiserRoundFilter) => {
    onRoundFilterChange(next);
    setRoundMenuOpen(false);
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <h3 className="min-w-0 text-[15px] font-semibold leading-tight text-[#111827] sm:text-base">
          {t("tournaments.matchesProgressTitle")}
        </h3>
        {availableRounds.length > 0 ? (
          <Popover open={roundMenuOpen} onOpenChange={setRoundMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "group inline-flex max-w-full shrink-0 cursor-pointer items-center gap-0.5 rounded-md",
                  "border border-[#010a04]/[0.06] bg-[#f4f6f8] px-1.5 py-0.5 text-left text-xs text-[#374151]",
                  "transition-colors",
                  "hover:border-[#010a04]/12 hover:bg-[#eef1f4]",
                  "focus:outline-none",
                  "focus-visible:border-[#067429]/40 focus-visible:bg-[#067429]/[0.08] focus-visible:ring-0",
                  "data-[state=open]:border-[#010a04]/14 data-[state=open]:bg-[#e8ecef]"
                )}
                aria-label={t("tournaments.matchesRoundFilterAria")}
                aria-haspopup="menu"
                aria-expanded={roundMenuOpen}
              >
                <span className="min-w-0">{triggerLabel}</span>
                <ChevronDown
                  size={11}
                  className={cn(
                    "shrink-0 opacity-45 transition-[transform,opacity] duration-200 group-hover:opacity-75",
                    roundMenuOpen && "rotate-180 opacity-80"
                  )}
                  aria-hidden
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-auto min-w-[10rem] max-w-[16rem] border-[#e5e7eb] p-1 shadow-sm"
            >
              <div className="flex flex-col gap-0.5" role="menu">
                <RoundMenuItem
                  active={roundFilter === "all"}
                  onClick={() => pickRound("all")}
                  label={t("tournaments.matchesProgressFilterAll")}
                />
                {availableRounds.map((round) => (
                  <RoundMenuItem
                    key={round}
                    active={roundFilter === round}
                    onClick={() => pickRound(round)}
                    label={t("tournaments.roundNumber", { round })}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
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

function RoundMenuItem({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
        active
          ? "bg-[#010a04]/[0.06] font-medium text-[#111827]"
          : "text-[#374151] hover:bg-[#f9fafb]"
      )}
    >
      {label}
    </button>
  );
}
