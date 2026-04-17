import type { TFunction } from "i18next";
import type { TournamentScheduleMode } from "@/models/tournament/types";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface SchedulePlayingModeControlProps {
  mode: TournamentScheduleMode;
  /** True when doubles cannot be selected (e.g. not enough participants). */
  doublesLocked: boolean;
  /** True while doubles pairs are being generated. */
  pairingPending: boolean;
  onChange: (next: TournamentScheduleMode) => void;
  t: TFunction;
  className?: string;
}

/**
 * Inline singles/doubles toggle using a standard switch (off = singles, on = doubles).
 */
export function SchedulePlayingModeControl({
  mode,
  doublesLocked,
  pairingPending,
  onChange,
  t,
  className,
}: SchedulePlayingModeControlProps) {
  const hint = t("tournaments.schedulePlayingModeDoublesHint");
  const disabled = pairingPending || (doublesLocked && mode === "singles");
  const doublesDisabled = pairingPending || doublesLocked;
  const singlesActive = mode === "singles";
  const doublesActive = mode === "doubles";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}
      aria-busy={pairingPending}
    >
      <div className="flex items-center rounded-[10px] bg-[#010a04]/5 p-1 md:hidden">
        <button
          type="button"
          onClick={() => onChange("singles")}
          disabled={pairingPending || singlesActive}
          className={cn(
            "h-[30px] rounded-[8px] px-[17px] text-[14px] font-medium transition-all",
            singlesActive
              ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
              : "text-[#010a04]/75 hover:text-[#010a04]"
          )}
          aria-pressed={singlesActive}
          aria-label={t("tournaments.scheduleSingles")}
        >
          {t("tournaments.scheduleSingles")}
        </button>
        <button
          type="button"
          onClick={() => onChange("doubles")}
          disabled={doublesDisabled}
          title={doublesLocked ? hint : undefined}
          className={cn(
            "h-[30px] rounded-[8px] px-[15px] text-[14px] font-medium transition-all",
            doublesActive
              ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
              : "text-[#010a04]/70 hover:text-[#010a04]",
            doublesDisabled ? "cursor-not-allowed opacity-55" : null
          )}
          aria-pressed={doublesActive}
          aria-label={t("tournaments.scheduleDoubles")}
        >
          {t("tournaments.scheduleDoubles")}
        </button>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <span
          className={cn(
            "text-[14px] leading-none",
            mode === "singles" ? "font-medium text-[#010a04]" : "text-[#010a04]/45"
          )}
        >
          {t("tournaments.scheduleSingles")}
        </span>
        <Switch
          id="tournament-schedule-playing-mode"
          checked={mode === "doubles"}
          onCheckedChange={(checked) => {
            onChange(checked ? "doubles" : "singles");
          }}
          disabled={disabled}
          title={doublesLocked && mode === "singles" ? hint : undefined}
          aria-label={t("tournaments.schedulePlayingMode")}
          className="data-[state=checked]:bg-[#1b8135]"
        />
        <span
          className={cn(
            "text-[14px] leading-none",
            mode === "doubles" ? "font-medium text-[#010a04]" : "text-[#010a04]/45"
          )}
        >
          {t("tournaments.scheduleDoubles")}
        </span>
      </div>

      {pairingPending ? (
        <span className="sr-only">{t("tournaments.scheduleDoublesArranging")}</span>
      ) : null}
    </div>
  );
}
