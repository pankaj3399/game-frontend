import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconChevronDown } from "@/icons/figma-icons";
import {
  SCORE_SELECT_EMPTY_VALUE,
  getScoreSelectOptions,
  type ScoreEditorRow,
  type ScoreEditorSide,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import type { AllowedPlayMode } from "../types";
import { asSelectValue, getScorePickerLabel } from "../helpers";

type ScoreGridProps = {
  rows: ScoreEditorRow[];
  playMode: AllowedPlayMode;
  isConfirmLocked: boolean;
  openScorePickerKey: string | null;
  setOpenScorePickerKey: (key: string | null) => void;
  onScoreChange: (
    rowId: string,
    side: ScoreEditorSide,
    setIndex: number,
    value: string,
  ) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function ScoreGrid({
  rows,
  playMode,
  isConfirmLocked,
  openScorePickerKey,
  setOpenScorePickerKey,
  onScoreChange,
  t,
}: ScoreGridProps) {
  return (
    <div className="space-y-2.5">
      {(
        [
          ["playerOne", t("recordScorePage.enter.myScore")],
          ["playerTwo", t("recordScorePage.enter.opponentScore")],
        ] as Array<[ScoreEditorSide, string]>
      ).map(([side, label]) => (
        <div
          key={side}
          className="grid grid-cols-[108px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[140px_minmax(0,1fr)]"
        >
          <p className="text-[14px] text-[#010a04]">{label}</p>
          <div className="grid grid-cols-3 gap-2">
            {rows.map((row, setIndex) => {
              const options = getScoreSelectOptions(
                row,
                side,
                playMode,
                setIndex,
              );
              const value = asSelectValue(
                side === "playerOne" ? row.playerOne : row.playerTwo,
              );
              const oppositeRaw =
                side === "playerOne" ? row.playerTwo : row.playerOne;
              const isOppositeWalkover = oppositeRaw.trim().toUpperCase() === "WO";
              const shouldRenderDashPlaceholder =
                isOppositeWalkover && value === SCORE_SELECT_EMPTY_VALUE;
              const pickerKey = `${row.id}-${side}`;

              return (
                <div key={pickerKey} className="w-full min-w-0">
                  <Popover
                    open={isConfirmLocked ? false : openScorePickerKey === pickerKey}
                    onOpenChange={(nextOpen) => {
                      if (isConfirmLocked) return;
                      setOpenScorePickerKey(nextOpen ? pickerKey : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isConfirmLocked || shouldRenderDashPlaceholder}
                        className="h-[34px] w-full min-w-0 justify-between rounded-[8px] border-[#010a04]/10 bg-[#f2f4f3] px-2.5 text-[13px] font-normal text-[#010a04] hover:bg-[#edf0ef]"
                      >
                        <span className="truncate">
                          {shouldRenderDashPlaceholder
                            ? "-"
                            : getScorePickerLabel(value, setIndex, t)}
                        </span>
                        <IconChevronDown
                          size={13}
                          className="ml-1 shrink-0 text-[#010a04]/55"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={6}
                      className="w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] rounded-[10px] border-[#010a04]/10 p-1"
                    >
                      <div className="thin-scrollbar max-h-44 overflow-y-auto rounded-[8px] border border-[#010a04]/8">
                        {options
                          .filter(
                            (option) => option.value !== SCORE_SELECT_EMPTY_VALUE,
                          )
                          .map((option) => (
                          <button
                            key={`${row.id}-${side}-${option.value}`}
                            type="button"
                            onClick={() => {
                              onScoreChange(row.id, side, setIndex, option.value);
                              setOpenScorePickerKey(null);
                            }}
                            className={`block w-full border-b border-[#010a04]/8 px-2.5 py-1.5 text-left text-[12px] last:border-b-0 ${
                              option.value === value
                                ? "bg-[#067429]/10 font-medium text-[#067429]"
                                : "text-[#010a04] hover:bg-[#010a04]/[0.035]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
