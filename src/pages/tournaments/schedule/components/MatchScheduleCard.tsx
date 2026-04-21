import type { Locale } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  IconCalendarDays,
  IconClock,
  IconMap,
  IconPenLine,
} from "@/icons/figma-icons";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { matchScheduleDateTimeLabels } from "@/pages/tournaments/schedule/utils/matchScheduleLabels";
import { MatchCardReadOnlyRows } from "@/pages/tournaments/schedule/components/MatchCardReadOnlyRows";
import { scoreColumns, type ScoreEditorRow } from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import { teamSideDisplayName } from "@/pages/tournaments/schedule/utils/matchTeamDisplay";
import { initialsFromName } from "@/pages/tournaments/schedule/utils/matchDisplayUtils";

const AVATAR_TONES = [
  "from-[#f7d4bf] to-[#efb598]",
  "from-[#d5e5f6] to-[#acc8e7]",
  "from-[#d9efdd] to-[#b9dfc4]",
  "from-[#f7e5bb] to-[#efd587]",
  "from-[#e8ddfb] to-[#cab6ef]",
  "from-[#ffd8e0] to-[#f4b3c2]",
];

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return (hash >>> 0) % 2147483647;
}

export interface MatchScheduleCardProps {
  match: TournamentScheduleMatch;
  locale: Locale;
  t: (key: string, options?: Record<string, unknown>) => string;
  canEditScores: boolean;
  isEditing: boolean;
  editableRows: ScoreEditorRow[];
  isMutationPending: boolean;
  onToggleEdit: (match: TournamentScheduleMatch) => void | Promise<void>;
  onScoreInputChange: (
    rowId: string,
    side: "playerOne" | "playerTwo",
    value: string
  ) => void;
}

export function MatchScheduleCard({
  match,
  locale,
  t,
  canEditScores,
  isEditing,
  editableRows,
  isMutationPending,
  onToggleEdit,
  onScoreInputChange,
}: MatchScheduleCardProps) {
  const unknown = t("tournaments.unknownPlayer");
  const firstPlayer = teamSideDisplayName(match, 0, t) || unknown;
  const secondPlayer = teamSideDisplayName(match, 1, t) || unknown;
  const courtName = match.court.name ?? t("tournaments.courtTBD");
  const tone = AVATAR_TONES[hashSeed(match.id) % AVATAR_TONES.length] ?? AVATAR_TONES[0];
  const tbd = t("tournaments.scheduledTbd");
  const { date: dateLabel, time: timeLabel } = matchScheduleDateTimeLabels(match.startTime, locale, tbd);
  const columns = scoreColumns(match);

  const isLive = match.status === "inProgress";
  const isPendingScore = match.status === "pendingScore";
  const isCancelled = match.status === "cancelled";

  return (
    <article
      className={cn(
        "rounded-[12px] border px-[15px] py-[15px]",
        isLive
          ? "border-[#067429] bg-[#eef8f1]"
          : isPendingScore
            ? "border-[#b45309] bg-[#fff7ed]"
          : "border-transparent bg-[#010a04]/[0.04]"
      )}
    >
      <div className="mb-[14px] flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 text-[13px] text-[#6a6a6a]">
          <span className="flex items-center gap-1.5">
            <IconCalendarDays size={14} className="shrink-0 text-[#6a6a6a]" />
            <span className="truncate">{dateLabel}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <IconClock size={14} className="shrink-0 text-[#6a6a6a]" />
            <span className="truncate">{timeLabel}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <IconMap size={14} className="shrink-0 text-[#6a6a6a]" />
            <span className="truncate">{courtName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#d92100]">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#d92100]" />
              {t("tournaments.liveLabel")}
            </span>
          ) : isPendingScore ? (
            <span className="text-[12px] font-medium text-[#b45309]">
              {t("tournaments.matchStatusPendingScore")}
            </span>
          ) : isCancelled ? (
            <span className="text-[12px] font-medium text-[#d92100]">{t("tournaments.matchStatusCancelled")}</span>
          ) : null}
          {canEditScores ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isCancelled) {
                  return;
                }
                void onToggleEdit(match);
              }}
              disabled={isMutationPending || isCancelled}
              className="h-8 w-8 rounded-md border border-[#010a04]/10 p-0 text-[#010a04] hover:bg-[#010a04]/5"
              title={
                isCancelled
                  ? t("tournaments.matchStatusCancelled")
                  : isEditing
                    ? t("tournaments.liveModalSaveScore")
                    : t("tournaments.editScore")
              }
              aria-label={
                isCancelled
                  ? t("tournaments.matchStatusCancelled")
                  : isEditing
                    ? t("tournaments.liveModalSaveScore")
                    : t("tournaments.editScore")
              }
            >
              {isEditing ? (
                <CheckIcon size={14} className="text-[#067429]" />
              ) : (
                <IconPenLine size={14} className="text-[#010a04]/80" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {isEditing && canEditScores ? (
        <div className="mb-2 flex justify-end gap-1.5">
          {Array.from({ length: editableRows.length }, (_, columnIndex) => (
            <span
              key={`${match.id}-set-${columnIndex}`}
              className="inline-flex min-w-[64px] items-center justify-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#010a04]/45"
            >
              S{columnIndex + 1}
            </span>
          ))}
        </div>
      ) : null}

      {isEditing && canEditScores ? (
        <div className="space-y-[10px]">
          {[firstPlayer, secondPlayer].map((name, index) => {
            const side = index === 0 ? "one" : "two";
            return (
              <div key={`${match.id}-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-[11px] font-semibold text-[#010a04]/80`}
                  >
                    {initialsFromName(name)}
                  </span>
                  <span className="truncate text-[16px] font-medium leading-[20px] text-[#010a04]">{name}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-[8px] bg-white/80 px-1 py-1">
                  {editableRows.map((row, rowIndex) => {
                    const value = side === "one" ? row.playerOne : row.playerTwo;
                    return (
                      <input
                        key={`${row.id}-${side}-input`}
                        type="text"
                        inputMode="text"
                        aria-label={t("tournaments.scoreInputLabel", {
                          playerName: name,
                          setNumber: rowIndex + 1,
                        })}
                        value={value}
                        onChange={(event) =>
                          onScoreInputChange(
                            row.id,
                            side === "one" ? "playerOne" : "playerTwo",
                            event.target.value
                          )
                        }
                        placeholder={t("tournaments.scorePlaceholder")}
                        className="h-[34px] w-[64px] rounded-[7px] border border-[#010a04]/20 bg-white px-2 text-center text-[13px] font-semibold text-[#010a04] outline-none transition focus:border-[#067429]"
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <MatchCardReadOnlyRows
          matchId={match.id}
          tone={tone}
          columns={columns}
          rows={[
            { name: firstPlayer, side: "one" },
            { name: secondPlayer, side: "two" },
          ]}
        />
      )}
    </article>
  );
}
