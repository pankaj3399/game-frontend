import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  formatScoreCellValue,
  scoreCellClass,
  type ScoreColumn,
} from "../utils/matchScheduleScore";
import { initialsFromName } from "../utils/avatarUtils";

export type MatchCardReadOnlyRow = {
  name: string;
  side: "one" | "two";
  nameSuffix?: ReactNode;
};

type Props = {
  matchId: string;
  tone: string;
  columns: ScoreColumn[];
  rows: [MatchCardReadOnlyRow, MatchCardReadOnlyRow];
};

export function MatchCardReadOnlyRows({ matchId, tone, columns, rows }: Props) {
  const hasCols = columns.length > 0;

  return (
    <div className="flex flex-col gap-0.5">
      {hasCols && (
        <div className="mb-1 flex justify-end gap-1 pr-2.5">
          {columns.map((_, i) => (
            <span
              key={`${matchId}-set-lbl-${i}`}
              className="w-8 text-center text-[9px] font-semibold uppercase tracking-[0.05em] text-[#010a04]/40"
            >
              S{i + 1}
            </span>
          ))}
        </div>
      )}

      {rows.map((row) => (
        <div
          key={`${matchId}-${row.side}`}
          className="flex items-center justify-between gap-3 rounded-[10px] px-2.5 py-2"
        >
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-[#010a04]/70",
                  tone
                )}
              >
                {initialsFromName(row.name)}
              </span>

              {row.nameSuffix != null ? (
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="min-w-0 break-words text-[14px] font-medium leading-snug text-[#010a04]">
                    {row.name}
                  </span>
                  {row.nameSuffix}
                </span>
              ) : (
                <span className="truncate text-[14px] font-medium leading-tight text-[#010a04]">
                  {row.name}
                </span>
              )}
            </div>

            {hasCols && (
              <div className="flex shrink-0 items-center gap-1">
                {columns.map((column, ci) => {
                  const value = row.side === "one" ? column.playerOne : column.playerTwo;
                  return (
                    <span
                      key={`${matchId}-${row.side}-${ci}`}
                      className={cn(
                        "inline-flex h-[30px] w-8 items-center justify-center rounded-[6px] text-[13px] font-semibold",
                        scoreCellClass(column.winner, row.side, value != null)
                      )}
                    >
                      {formatScoreCellValue(value)}
                    </span>
                  );
                })}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}