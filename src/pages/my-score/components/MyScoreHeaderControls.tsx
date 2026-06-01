import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ShareTextButton } from "@/components/shared/ShareTextButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MyScoreDateRange, MyScoreFilterMode } from "@/models/myScore/types";
import { DATE_RANGES, FILTER_MODES } from "../constants";

interface MyScoreHeaderControlsProps {
  title: string;
  mode: MyScoreFilterMode;
  range: MyScoreDateRange;
  onChangeMode: (mode: MyScoreFilterMode) => void;
  onChangeRange: (range: string) => void;
  onShare: () => void;
  children: ReactNode;
}

export function MyScoreHeaderControls({
  title,
  mode,
  range,
  onChangeMode,
  onChangeRange,
  onShare,
  children,
}: MyScoreHeaderControlsProps) {
  const { t } = useTranslation();

  return (
    <Card className="gap-0 overflow-hidden rounded-[10px] border border-[#010a04]/10 bg-white py-0 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-2.5 sm:px-5 lg:gap-3">
        <CardTitle className="hidden shrink-0 text-[28px] font-semibold tracking-[-0.02em] text-[#010a04] lg:block">
          {title}
        </CardTitle>

        {/*
         * Below lg the navbar shows the page title — no duplicate heading here.
         * max-sm: pills on one row, date + share on the next.
         * sm–lg: single horizontal toolbar (fixes awkward stacked layout ~640–1023px).
         * lg+: title above; this block stays inline with filters + share.
         */}
        <div className="flex min-w-0 flex-col gap-2 sm:ml-auto sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2 lg:ml-auto lg:flex-nowrap">
          <ModeFilterPills
            mode={mode}
            onChangeMode={onChangeMode}
            className="w-full min-w-0 sm:w-auto"
          />
          <div className="flex min-w-0 items-center gap-2">
            <RangeFilterSelect
              range={range}
              onChangeRange={onChangeRange}
              triggerClassName="h-9 min-w-0 flex-1 sm:h-8 sm:w-[112px] sm:flex-none"
            />
            <ShareTextButton
              className="shrink-0"
              label={t("myScorePage.share")}
              onClick={onShare}
            />
          </div>
        </div>
      </div>

      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function ModeFilterPills({
  mode,
  onChangeMode,
  className,
}: {
  mode: MyScoreFilterMode;
  onChangeMode: (mode: MyScoreFilterMode) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center rounded-[7px] bg-[#010a04]/[0.05] p-0.5",
        className,
      )}
    >
      {FILTER_MODES.map((value) => {
        const selected = mode === value;
        return (
          <Button
            key={value}
            variant="ghost"
            aria-pressed={selected}
            onClick={() => onChangeMode(value)}
            className={cn(
              "h-8 min-w-0 flex-1 whitespace-nowrap rounded-[6px] px-2.5 text-[12px] font-medium leading-none transition-all sm:flex-none sm:px-3",
              selected
                ? "bg-white text-[#010a04] shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-white"
                : "text-[#010a04]/65 hover:text-[#010a04]",
            )}
          >
            {t(`myScorePage.filters.${value}`)}
          </Button>
        );
      })}
    </div>
  );
}

function RangeFilterSelect({
  range,
  onChangeRange,
  triggerClassName,
}: {
  range: MyScoreDateRange;
  onChangeRange: (range: string) => void;
  triggerClassName?: string;
}) {
  const { t } = useTranslation();

  return (
    <Select value={range} onValueChange={onChangeRange}>
      <SelectTrigger
        className={cn(
          "rounded-[7px] border-[#010a04]/12 px-2.5 text-[12px]",
          triggerClassName,
        )}
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {DATE_RANGES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`myScorePage.filters.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
