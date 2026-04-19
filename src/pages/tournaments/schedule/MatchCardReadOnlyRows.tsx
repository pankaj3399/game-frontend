import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  formatScoreCellValue,
  scoreCellClass,
  type ScoreColumn,
} from "./matchScheduleScore";

function initialsFromName(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "?";
  }

  const first = tokens[0][0] ?? "";
  const second = tokens.length > 1 ? tokens[tokens.length - 1][0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
}

export type MatchCardReadOnlyRow = {
  name: string;
  side: "one" | "two";
  /** Optional content after the player name (e.g. winner label). Enables wrapping for long names. */
  nameSuffix?: ReactNode;
};

type MatchCardReadOnlyRowsProps = {
  matchId: string;
  /** Tailwind gradient color stops for the avatar, e.g. `from-[#f7d4bf] to-[#efb598]` (used with `bg-gradient-to-br`). */
  tone: string;
  columns: ScoreColumn[];
  rows: [MatchCardReadOnlyRow, MatchCardReadOnlyRow];
};

/**
 * Read-only player rows + per-set score strip — same layout as {@link MatchScheduleCard} (non-edit mode).
 */
export function MatchCardReadOnlyRows({ matchId, tone, columns, rows }: MatchCardReadOnlyRowsProps) {
  return (
    <div className="space-y-[10px]">
      {rows.map((row, index) => (
        <div key={`${matchId}-${row.side}-${index}`} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-[#010a04]/80",
                tone
              )}
            >
              {initialsFromName(row.name)}
            </span>
            {row.nameSuffix != null ? (
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="min-w-0 break-words text-[16px] font-medium leading-snug text-[#010a04]">{row.name}</span>
                {row.nameSuffix}
              </span>
            ) : (
              <span className="truncate text-[16px] font-medium leading-[20px] text-[#010a04]">{row.name}</span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {columns.map((_, columnIndex) => (
                <span
                  key={`${matchId}-${row.side}-set-${columnIndex + 1}`}
                  className="inline-flex min-w-[42px] items-center justify-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#010a04]/45"
                >
                  S{columnIndex + 1}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-[8px] bg-white/70 px-1 py-1">
              {columns.map((column, columnIndex) => {
                const value = row.side === "one" ? column.playerOne : column.playerTwo;
                const hasValue = value != null;
                return (
                  <span
                    key={`${matchId}-${row.side}-${columnIndex}`}
                    className={cn(
                      "inline-flex h-[34px] min-w-[42px] items-center justify-center rounded-[7px] px-2 text-[13px] font-semibold",
                      scoreCellClass(column.winner, row.side, hasValue)
                    )}
                  >
                    {formatScoreCellValue(value)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
