import * as React from "react";
import type { TFunction } from "i18next";
import { SwitchToggle } from "@/components/ui/switch-toggle";

interface ResultsHeaderProps {
  myScoreOnly: boolean;
  onMyScoreOnlyChange: (checked: boolean) => void;
  /** Show hint that sign-in is needed (switch remains clickable to trigger login redirect). */
  showSignInHint?: boolean;
  /** Completed matches counted in standings (all rounds). */
  recordedMatchCount: number;
  /** Total scheduled matches (all rounds). */
  scheduledMatchCount: number;
  t: TFunction;
}

export function ResultsHeader({
  myScoreOnly,
  onMyScoreOnlyChange,
  showSignInHint = false,
  recordedMatchCount,
  scheduledMatchCount,
  t,
}: ResultsHeaderProps) {
  const hintId = React.useId();
  const showScoreBase = scheduledMatchCount > 0;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[20px] font-semibold leading-tight text-[#010a04]">
          {t("tournaments.allResults")}
        </h2>
        {showScoreBase ? (
          <p className="mt-1 text-sm leading-snug text-[#6b7280]">
            {t("tournaments.standingsScoreBase", {
              recorded: recordedMatchCount,
              scheduled: scheduledMatchCount,
            })}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:max-w-sm">
        <SwitchToggle
          checked={showSignInHint ? false : myScoreOnly}
          onCheckedChange={onMyScoreOnlyChange}
          aria-describedby={showSignInHint ? hintId : undefined}
          className="gap-[12px] text-[14px] font-normal text-[#010a04]"
          switchClassName="data-[state=checked]:bg-brand-primary"
        >
          {t("settings.nav.myScore")}
        </SwitchToggle>
        {showSignInHint ? (
          <p id={hintId} className="text-right text-xs leading-snug text-[#6b7280]">
            {t("tournaments.myScoreFilterSignInHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
