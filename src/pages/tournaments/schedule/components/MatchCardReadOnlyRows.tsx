import type { CSSProperties, ReactNode } from "react";
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
  subtext?: ReactNode;
};

type Props = {
  matchId: string;
  tone: string;
  columns: ScoreColumn[];
  rows: [MatchCardReadOnlyRow, MatchCardReadOnlyRow];
};

export function MatchCardReadOnlyRows({ matchId, tone, columns, rows }: Props) {
  const visibleColumns = columns
    .map((column, index) => ({ column, index }))
    .filter(
      ({ column }) => column.playerOne != null || column.playerTwo != null
  );
  const hasCols = visibleColumns.length > 0;
  const scoreGridStyle = {
    "--score-column-count": Math.max(visibleColumns.length, 1),
    gridTemplateColumns: `repeat(${Math.max(visibleColumns.length, 1)}, minmax(calc(3ch + 1rem), max-content))`,
  } as CSSProperties;

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {rows.map((row) => (
        <div
          key={`${matchId}-${row.side}`}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[10px] px-2.5 py-2"
        >
          <div className="flex min-w-[80px] flex-1 items-center gap-2.5">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-[#010a04]/70",
                tone
              )}
            >
              {initialsFromName(row.name)}
            </span>

            {row.nameSuffix != null ? (
              <div className="flex min-w-0 flex-col">
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="truncate text-[14px] font-medium leading-snug text-[#010a04]">
                    {row.name}
                  </span>
                  {row.nameSuffix}
                </span>
                {row.subtext != null ? (
                  <span className="truncate text-[11px] font-medium leading-tight text-[rgb(1,10,4)]/50">
                    {row.subtext}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-medium leading-tight text-[#010a04]">
                  {row.name}
                </span>
                {row.subtext != null ? (
                  <span className="truncate text-[11px] font-medium leading-tight text-[rgb(1,10,4)]/50">
                    {row.subtext}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {hasCols && (
            <div className="inline-grid min-w-0 justify-self-end gap-1" style={scoreGridStyle}>
              {visibleColumns.map(({ column, index }) => {
                const value = row.side === "one" ? column.playerOne : column.playerTwo;
                return (
                  <span
                    key={`${matchId}-${row.side}-${index}`}
                    className={cn(
                      "inline-flex h-8 min-w-[calc(3ch+1rem)] items-center justify-center rounded-[6px] px-1 text-[13px] font-semibold",
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
