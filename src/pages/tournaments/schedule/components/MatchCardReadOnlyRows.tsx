import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  formatScoreCellValue,
  scoreCellClass,
  scoreCellHasDisplayValue,
  type ScoreColumn,
} from "../utils/matchScheduleScore";
import { initialsFromName } from "../utils/avatarUtils";

export type MatchCardReadOnlyRow = {
  name: string;
  side: "one" | "two";
  profilePictureUrl?: string | null;
  nameSuffix?: ReactNode;
  subtext?: ReactNode;
};

type Props = {
  matchId: string;
  tone: string;
  columns: ScoreColumn[];
  rows: [MatchCardReadOnlyRow, MatchCardReadOnlyRow];
};

function RowAvatar({
  profilePictureUrl,
  displayName,
}: {
  profilePictureUrl?: string | null;
  displayName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  if (profilePictureUrl && !imageFailed) {
    return (
      <img
        src={profilePictureUrl}
        alt={`Avatar for ${displayName}`}
        className="size-full rounded-full object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }
  return initialsFromName(displayName);
}

export function MatchCardReadOnlyRows({ matchId, tone, columns, rows }: Props) {
  const visibleColumns = columns
    .map((column, index) => ({ column, index }))
    .filter(
      ({ column }) => column.playerOne != null || column.playerTwo != null
  );
  const hasCols = visibleColumns.length > 0;
  const scoreGridStyle = {
    "--score-column-count": Math.max(visibleColumns.length, 1),
    gridTemplateColumns: `repeat(${Math.max(visibleColumns.length, 1)}, 2rem)`,
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
              <RowAvatar profilePictureUrl={row.profilePictureUrl} displayName={row.name} />
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
            <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <div className="ml-auto inline-grid min-w-0 gap-1" style={scoreGridStyle}>
              {visibleColumns.map(({ column, index }) => {
                const value = row.side === "one" ? column.playerOne : column.playerTwo;
                return (
                  <span
                    key={`${matchId}-${row.side}-${index}`}
                    className={cn(
                      "inline-flex h-8 w-8 min-h-8 min-w-8 max-w-8 shrink-0 items-center justify-center rounded-[6px] px-0 text-[13px] font-semibold",
                      scoreCellClass(
                        column.winner,
                        row.side,
                        scoreCellHasDisplayValue(
                          value,
                          column.playerOne,
                          column.playerTwo,
                          column.winner,
                          row.side,
                        ),
                      )
                    )}
                  >
                    {formatScoreCellValue(
                      value,
                      column.playerOne,
                      column.playerTwo,
                      column.winner,
                      row.side,
                    )}
                  </span>
                );
              })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
