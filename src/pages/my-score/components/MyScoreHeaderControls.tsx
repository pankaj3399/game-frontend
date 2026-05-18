import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ShareTextButton } from "@/components/shared/ShareTextButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="overflow-hidden rounded-[10px] border border-[#010a04]/10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <CardHeader className="px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2.5 sm:gap-2">
          <div className="flex items-center justify-between gap-2.5 sm:hidden">
            <CardTitle className="shrink-0 text-[22px] font-semibold tracking-[-0.02em] text-[#010a04]">
              {title}
            </CardTitle>
            <ShareTextButton
              className="shrink-0"
              label={t("myScorePage.share")}
              onClick={onShare}
            />
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <CardTitle className="shrink-0 text-[28px] font-semibold tracking-[-0.02em] text-[#010a04]">
              {title}
            </CardTitle>
            <div className="ml-auto flex items-center gap-1.5">
              <ModeFilterPills mode={mode} onChangeMode={onChangeMode} />
              <RangeFilterSelect range={range} onChangeRange={onChangeRange} />
            </div>
            <ShareTextButton
              className="shrink-0"
              label={t("myScorePage.share")}
              onClick={onShare}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
            <ModeFilterPills mode={mode} onChangeMode={onChangeMode} />
            <RangeFilterSelect range={range} onChangeRange={onChangeRange} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function ModeFilterPills({
  mode,
  onChangeMode,
}: {
  mode: MyScoreFilterMode;
  onChangeMode: (mode: MyScoreFilterMode) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center rounded-[7px] bg-[#010a04]/[0.05] p-0.5">
      {FILTER_MODES.map((value) => {
        const selected = mode === value;
        return (
          <Button
            key={value}
            variant="ghost"
            aria-pressed={selected}
            onClick={() => onChangeMode(value)}
            className={cn(
              "h-7 whitespace-nowrap rounded-[6px] px-3 text-[11px] font-medium leading-none transition-all",
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
}: {
  range: MyScoreDateRange;
  onChangeRange: (range: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Select value={range} onValueChange={onChangeRange}>
      <SelectTrigger className="h-8 w-[112px] rounded-[7px] border-[#010a04]/12 px-2.5 text-[11px]">
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
