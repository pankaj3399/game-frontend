import * as React from "react";
import type { TFunction } from "i18next";
import { SwitchToggle } from "@/components/ui/switch-toggle";

interface ResultsHeaderProps {
  myScoreOnly: boolean;
  onMyScoreOnlyChange: (checked: boolean) => void;
  /** When true, the filter switch is inert (e.g. anonymous users). */
  disabled?: boolean;
  t: TFunction;
}

export function ResultsHeader({
  myScoreOnly,
  onMyScoreOnlyChange,
  disabled = false,
  t,
}: ResultsHeaderProps) {
  const hintId = React.useId();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold text-[#111827]">{t("tournaments.allResults")}</h2>
      <div className="flex flex-col items-end gap-1.5 sm:max-w-sm">
        <SwitchToggle
          checked={disabled ? false : myScoreOnly}
          onCheckedChange={onMyScoreOnlyChange}
          disabled={disabled}
          aria-describedby={disabled ? hintId : undefined}
        >
          {t("settings.nav.myScore")}
        </SwitchToggle>
        {disabled ? (
          <p id={hintId} className="text-right text-xs leading-snug text-[#6b7280]">
            {t("tournaments.myScoreFilterSignInHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
