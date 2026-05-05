import type { Locale } from "date-fns";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  IconCalendarDays, IconClock, IconMap, PencilEdit01Icon,
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
import { teamEloRating } from "@/pages/tournaments/components/details-tabs/matches-tab/ratingSummary";
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
  
  const firstPlayerRating = teamEloRating(match.side1);
  const secondPlayerRating = teamEloRating(match.side2);
  const firstPlayerSubtext = firstPlayerRating != null ? `G3: ${firstPlayerRating}` : undefined;
  const secondPlayerSubtext = secondPlayerRating != null ? `G3: ${secondPlayerRating}` : undefined;

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
  const roundLabel = t("tournaments.roundNumber", { round: match.round });

  const isLive = match.status === "inProgress";
  const isPendingScore = match.status === "pendingScore";
  const isCancelled = match.status === "cancelled";
  const isFromPreviousRound = match.detachedFromRound != null;
  const hasStatusBadge = isLive || isPendingScore || isCancelled;
  const scoreGridStyle = {
    "--score-column-count": Math.max(editableRowsToRender.length, 1),
    gridTemplateColumns: `repeat(${Math.max(editableRowsToRender.length, 1)}, minmax(calc(3ch + 1rem), max-content))`,
  } as CSSProperties;

  return (
    <article
      className={cn(
        "flex h-full min-w-0 flex-col rounded-[14px] border px-4 py-4 shadow-[0_1px_2px_rgba(1,10,4,0.04)]",
        isLive
          ? "border-[#067429]/30 bg-[#f6fbf7]"
          : isPendingScore
            ? "border-[#b45309]/25 bg-[#fffaf3]"
            : isCancelled
              ? "border-[#010a04]/[0.06] bg-white"
              : "border-[#010a04]/[0.06] bg-white"
      )}
    >
      {/* Header: metadata + edit button */}
      <div className="mb-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
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
          <span className="inline-flex shrink-0 rounded-full bg-[#010a04]/[0.06] px-2 py-0.5 text-[11px] font-semibold text-[#010a04]/60">
            {roundLabel}
          </span>
        </div>
        {canEditScores && !isCancelled && !isFromPreviousRound && (
          <Button
            type="button"
            size="sm"
            onClick={() => void onToggleEdit(match)}
            disabled={isSavePending || isCancelled || isFromPreviousRound}
            className={cn(
              "h-7 min-w-0 justify-self-end rounded-[7px] px-2.5 text-[12px] font-medium shadow-none",
              isEditing
                ? "bg-[#067429] text-white hover:bg-[#055d21]"
                : "border border-[#010a04]/[0.12] bg-white text-[#010a04] hover:bg-[#010a04]/[0.04]"
            )}
          >
            {!isEditing && !isSavePending ? (
              <PencilEdit01Icon size={13} aria-hidden className="text-current" />
            ) : null}
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
        {isEditing && canEditScores && !isFromPreviousRound ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            {[
              { name: firstPlayer, subtext: firstPlayerSubtext, idx: 0 },
              { name: secondPlayer, subtext: secondPlayerSubtext, idx: 1 },
            ].map(({ name, subtext, idx: playerIdx }) => {
              const side = playerIdx === 0 ? "one" : "two";
              const sideKey = playerIdx === 0 ? "playerOne" : "playerTwo";
              return (
                <div
                  key={`${match.id}-edit-${side}`}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[10px] px-2.5 py-2"
                >
                  <div className="flex min-w-[80px] flex-1 items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-[#010a04]/70",
                        tone
                      )}
                    >
                      {initialsFromName(name)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] font-medium leading-tight text-[#010a04]">
                        {name}
                      </span>
                      {subtext != null ? (
                        <span className="truncate text-[11px] font-medium leading-tight text-[rgb(1,10,4)]/50">
                          {subtext}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className="flex min-w-0 flex-col gap-1 justify-self-end"
                  >
                    {playerIdx === 0 ? (
                      <div
                        className="inline-grid min-w-0 gap-1"
                        style={scoreGridStyle}
                      >
                        {editableRowsToRender.map((_, i) => (
                          <span
                            key={`${match.id}-set-lbl-${i}`}
                            className="min-w-0 text-center text-[9px] font-semibold uppercase tracking-[0.05em] text-[#010a04]/35"
                          >
                            S{i + 1}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div
                      className="inline-grid min-w-0 gap-1"
                      style={scoreGridStyle}
                    >
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
                            className="h-8 min-w-[calc(3ch+1rem)] justify-center gap-0 rounded-[6px] border border-[#010a04]/[0.14] bg-white px-1 text-center text-[13px] font-semibold text-[#010a04] shadow-none focus:border-[#067429] *:data-[slot=select-value]:justify-center *:data-[slot=select-value]:text-center"
                          >
                            <SelectValue placeholder="–" />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            align="center"
                            sideOffset={6}
                            collisionPadding={12}
                            showScrollButtons={false}
                            className="max-h-64"
                          >
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
              { name: firstPlayer, subtext: firstPlayerSubtext, side: "one" },
              { name: secondPlayer, subtext: secondPlayerSubtext, side: "two" },
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
