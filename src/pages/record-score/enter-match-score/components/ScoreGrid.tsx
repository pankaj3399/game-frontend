import { useMemo } from "react";
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
  visibleScoreEditorRowsForRecordScore,
  type ScoreEditorRow,
  type ScoreEditorSide,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import type { AllowedPlayMode } from "../types";
import { asSelectValue, getScorePickerLabel } from "../helpers";

/** Width of each set score control (matches grid column). */
const SET_COLUMN_REM = 5.375;

type ScoreGridProps = {
  rows: ScoreEditorRow[];
  playMode: AllowedPlayMode;
  playerOneRowLabel: string;
  playerTwoRowLabel: string;
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
  playerOneRowLabel,
  playerTwoRowLabel,
  isConfirmLocked,
  openScorePickerKey,
  setOpenScorePickerKey,
  onScoreChange,
  t,
}: ScoreGridProps) {
  const visibleRows = useMemo(
    () => visibleScoreEditorRowsForRecordScore(rows, playMode),
    [rows, playMode],
  );

  const columnCount = Math.max(visibleRows.length, 1);
  const columnTemplate = useMemo(
    () => `repeat(${columnCount}, ${SET_COLUMN_REM}rem)`,
    [columnCount],
  );
  const playerRows = useMemo(
    () =>
      [
        ["playerOne", playerOneRowLabel],
        ["playerTwo", playerTwoRowLabel],
      ] as Array<[ScoreEditorSide, string]>,
    [playerOneRowLabel, playerTwoRowLabel],
  );

  return (
    <div className="space-y-4">
      {playerRows.map(([side, label]) => (
        <div
          key={side}
          className="flex min-w-0 flex-col items-center gap-2 rounded-[12px] border border-[#010a04]/[0.08] bg-[#f4f6f5] p-3 sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0"
        >
          <p
            className="min-w-0 max-w-full truncate text-center text-[13px] font-semibold leading-snug text-[#010a04] sm:w-[min(8.75rem,34vw)] sm:shrink-0 sm:text-right sm:text-[14px] sm:font-medium"
            title={label}
          >
            {label}
          </p>

          <div className="flex w-full min-w-0 justify-center sm:flex-1 sm:justify-start">
            <div className="max-w-full overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
              <div
                className="inline-grid gap-x-2 gap-y-2 sm:gap-x-2 sm:gap-y-2"
                style={{ gridTemplateColumns: columnTemplate }}
              >
                {visibleRows.map((row, setIndex) => {
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
                  const isOppositeWalkover =
                    oppositeRaw.trim().toUpperCase() === "WO";
                  const shouldRenderDashPlaceholder =
                    isOppositeWalkover && value === SCORE_SELECT_EMPTY_VALUE;
                  const pickerKey = `${row.id}-${side}`;

                  return (
                    <div
                      key={pickerKey}
                      className="shrink-0"
                      style={{ width: `${SET_COLUMN_REM}rem` }}
                    >
                      <Popover
                        open={
                          isConfirmLocked
                            ? false
                            : openScorePickerKey === pickerKey
                        }
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
                            className="h-[44px] w-full min-w-0 justify-between rounded-[10px] border-[#010a04]/10 bg-[#f2f4f3] px-2 text-[14px] font-normal tabular-nums text-[#010a04] hover:bg-[#edf0ef] sm:h-[34px] sm:rounded-[8px] sm:px-2 sm:text-[13px]"
                          >
                            <span className="truncate">
                              {shouldRenderDashPlaceholder
                                ? "-"
                                : getScorePickerLabel(value, setIndex, t)}
                            </span>
                            <IconChevronDown
                              size={14}
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
                                (option) =>
                                  option.value !== SCORE_SELECT_EMPTY_VALUE,
                              )
                              .map((option) => (
                                <button
                                  key={`${row.id}-${side}-${option.value}`}
                                  type="button"
                                  onClick={() => {
                                    onScoreChange(
                                      row.id,
                                      side,
                                      setIndex,
                                      option.value,
                                    );
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
          </div>
        </div>
      ))}
    </div>
  );
}
