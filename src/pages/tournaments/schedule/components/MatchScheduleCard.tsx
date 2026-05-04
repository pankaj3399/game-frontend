import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  IconCalendarDays, IconClock, IconMap,
} from "@/icons/figma-icons";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import { matchScheduleDateTimeLabels } from "@/pages/tournaments/schedule/utils/matchScheduleLabels";
import { MatchCardReadOnlyRows } from "./MatchCardReadOnlyRows";
import {
  getScoreSelectOptions,
  SCORE_SELECT_EMPTY_VALUE,
  scoreColumns,
  visibleScoreEditorRows,
  type ScoreEditorRow,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import { teamSideDisplayName } from "@/pages/tournaments/schedule/utils/matchTeamDisplay";
import { AVATAR_TONES, hashSeed, initialsFromName } from "@/pages/tournaments/schedule/utils/avatarUtils";

export interface MatchScheduleCardProps {
  match: TournamentScheduleMatch;
  locale: Locale;
  timeZone?: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
  canEditScores: boolean;
  isEditing: boolean;
  editableRows: ScoreEditorRow[];
  isSavePending: boolean;
  saveErrorMessage?: string | null;
  onToggleEdit: (match: TournamentScheduleMatch) => void | Promise<void>;
  onScoreInputChange: (
    rowId: string,
    side: "playerOne" | "playerTwo",
    value: string,
    setIndex: number
  ) => void;
}

export function MatchScheduleCard({
  match, locale, timeZone, t, canEditScores, isEditing, editableRows,
  isSavePending, saveErrorMessage, onToggleEdit, onScoreInputChange,
}: MatchScheduleCardProps) {
  const unknown = t("tournaments.unknownPlayer");
  const firstPlayer = teamSideDisplayName(match, 0, t) || unknown;
  const secondPlayer = teamSideDisplayName(match, 1, t) || unknown;
  const courtName = match.court.name ?? t("tournaments.courtTBD");
  const tone = AVATAR_TONES[hashSeed(match.id) % AVATAR_TONES.length] ?? AVATAR_TONES[0];
  const tbd = t("tournaments.scheduledTbd");
  const { date: dateLabel, time: timeLabel, timeZone: timeZoneLabel } =
    matchScheduleDateTimeLabels(match.startTime, locale, tbd, timeZone);
  const columns = scoreColumns(match);
  const editableRowsToRender = visibleScoreEditorRows(editableRows, match.playMode);
  const historicalBadgeLabel = t("tournaments.matchHistoricalBadge", {
    round: match.detachedFromRound ?? "?",
    defaultValue: "From previous round (R{{round}})",
  });

  const isLive = match.status === "inProgress";
  const isPendingScore = match.status === "pendingScore";
  const isCancelled = match.status === "cancelled";
  const hasStatusBadge = isLive || isPendingScore || isCancelled;

  return (
    <article
      className={cn(
        "flex h-full min-h-[172px] flex-col rounded-[14px] border px-4 py-4",
        isLive
          ? "border-[#067429] bg-[#eef8f1]"
          : isPendingScore
            ? "border-[#b45309] bg-[#fff7ed]"
            : isCancelled
              ? "border-transparent bg-[#010a04]/[0.03]"
              : "border-transparent bg-[#010a04]/[0.03]"
      )}
    >
      {/* Header: metadata + edit button */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-[999_1_0%] flex-wrap items-center gap-x-3 gap-y-1">
          {[
            { Icon: IconCalendarDays, label: dateLabel, timeZone: null },
            { Icon: IconClock, label: timeLabel, timeZone: timeZoneLabel },
            { Icon: IconMap, label: courtName, timeZone: null },
          ].map(({ Icon, label, timeZone }, index) => (
            <span
              key={`${match.id}-meta-${index}`}
              className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[#010a04]/50"
            >
              <Icon size={12} className="shrink-0" />
              <span className="inline-flex min-w-0 items-baseline gap-1">
                <span className="truncate">{label}</span>
                {timeZone ? (
                  <span className="shrink-0 text-[10px] font-medium leading-none text-[#010a04]/35">
                    {timeZone}
                  </span>
                ) : null}
              </span>
            </span>
          ))}
        </div>
        {canEditScores && !isCancelled && (
          <Button
            type="button"
            size="sm"
            onClick={() => void onToggleEdit(match)}
            disabled={isSavePending || isCancelled}
            className={cn(
              "ml-auto h-7 shrink-0 self-center rounded-[7px] px-3 text-[12px] font-medium max-[380px]:w-full max-[380px]:justify-center",
              isEditing
                ? "bg-[#067429] text-white hover:bg-[#055d21]"
                : "border border-[#010a04]/[0.12] bg-white text-[#010a04] hover:bg-[#010a04]/[0.04]"
            )}
          >
            {isSavePending
              ? t("tournaments.saving")
              : isEditing
                ? t("tournaments.saveChanges")
                : t("tournaments.editScore")}
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {saveErrorMessage && (
          <p className="mb-2.5 rounded-[8px] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#a02626]" role="status" aria-live="polite">
            {saveErrorMessage}
          </p>
        )}

        {/* Score editor (inline) */}
        {isEditing && canEditScores ? (
          <div className="flex flex-col gap-0.5">
          {/* Set labels */}
          {editableRowsToRender.length > 0 && (
            <div className="mb-1 flex justify-end gap-1 pr-2.5 max-[430px]:pr-0">
              {editableRowsToRender.map((_, i) => (
                <span
                  key={`${match.id}-set-lbl-${i}`}
                  className="w-12 text-center text-[9px] font-semibold uppercase tracking-[0.05em] text-[#010a04]/40 sm:w-16"
                >
                  S{i + 1}
                </span>
              ))}
            </div>
          )}

          {[firstPlayer, secondPlayer].map((name, playerIdx) => {
            const side = playerIdx === 0 ? "one" : "two";
            const sideKey = playerIdx === 0 ? "playerOne" : "playerTwo";
            return (
              <div
                key={`${match.id}-edit-${side}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[10px] px-2.5 py-2 max-[430px]:px-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-[#010a04]/70",
                      tone
                    )}
                  >
                    {initialsFromName(name)}
                  </span>
                  <span className="truncate text-[14px] font-medium text-[#010a04]">{name}</span>
                </div>

                <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 max-[430px]:w-full">
                  {editableRowsToRender.map((row, rowIndex) => {
                    const value = sideKey === "playerOne" ? row.playerOne : row.playerTwo;
                    const options = getScoreSelectOptions(row, sideKey, match.playMode, rowIndex);
                    return (
                      <Select
                        key={`${row.id}-${side}`}
                        value={value === "" ? SCORE_SELECT_EMPTY_VALUE : value}
                        onValueChange={(v) => onScoreInputChange(row.id, sideKey, v, rowIndex)}
                      >
                        <SelectTrigger
                          hideIcon
                          aria-label={t("tournaments.scoreInputLabel", { playerName: name, setNumber: rowIndex + 1 })}
                          className="h-[30px] w-11 justify-center gap-0 rounded-[6px] border border-[#010a04]/[0.14] bg-white px-1.5 text-center text-[13px] font-semibold text-[#010a04] focus:border-[#067429] sm:w-12 *:data-[slot=select-value]:justify-center *:data-[slot=select-value]:text-center"
                        >
                          <SelectValue placeholder="–" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((opt) => (
                            <SelectItem key={`${row.id}-${side}-${opt.value}`} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
      </div>

      {/* Historical + status badges */}
      {(match.isHistorical || hasStatusBadge) && (
        <div className="mt-auto flex min-h-[26px] flex-wrap items-center gap-2 pt-3">
          {match.isHistorical && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-medium text-[#1e3a8a]">
              {historicalBadgeLabel}
            </span>
          )}
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffeee9] px-2.5 py-1 text-[11px] font-medium text-[#d92100]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d92100]" />
              {t("tournaments.liveLabel")}
            </span>
          )}
          {isPendingScore && (
            <span className="inline-flex items-center rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-medium text-[#b45309]">
              {t("tournaments.matchStatusPendingScore")}
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center rounded-full bg-[#010a04]/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#010a04]/50">
              {t("tournaments.matchStatusCancelled")}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
