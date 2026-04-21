import { useState } from "react";
import { enUS } from "date-fns/locale";
import type { TFunction } from "i18next";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { cn } from "@/lib/utils";
import type { TournamentScheduleMatch, TournamentScheduleMode } from "@/models/tournament/types";
import { IconCalendarDays, IconClock, IconMap } from "@/icons/figma-icons";
import { MatchCardReadOnlyRows } from "@/pages/tournaments/schedule/components/MatchCardReadOnlyRows";
import { matchScheduleDateTimeLabels } from "@/pages/tournaments/schedule/utils/matchScheduleLabels";
import { scoreColumns, type ScoreColumn } from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import { teamSideDisplayName } from "@/pages/tournaments/schedule/utils/matchTeamDisplay";
import { AVATAR_TONES, hashSeed } from "@/pages/tournaments/schedule/utils/avatarUtils";
import { withBracketedElo } from "./ratingSummary";

interface PlayerMatchesBoardProps {
  matches: TournamentScheduleMatch[];
  currentUserId: string | null;
  language: string;
  t: TFunction;
}

function isCurrentUserInMatch(match: TournamentScheduleMatch, currentUserId: string | null): boolean {
  if (!currentUserId) {
    return false;
  }

  const directPlayers = match.players.some((player) => player?.id === currentUserId);
  if (directPlayers) {
    return true;
  }

  for (const team of [match.side1, match.side2]) {
    for (const player of team) {
      if (player?.id === currentUserId) {
        return true;
      }
    }
  }

  return false;
}

/** Best-of style: side with more sets won (uses per-set winners from {@link scoreColumns}). */
function aggregateMatchWinner(columns: ScoreColumn[]): "one" | "two" | null {
  let setsOne = 0;
  let setsTwo = 0;
  for (const col of columns) {
    if (col.winner === "one") {
      setsOne += 1;
    }
    if (col.winner === "two") {
      setsTwo += 1;
    }
  }
  if (setsOne === 0 && setsTwo === 0) {
    return null;
  }
  if (setsOne > setsTwo) {
    return "one";
  }
  if (setsTwo > setsOne) {
    return "two";
  }
  return null;
}

function PlayerMatchCard({
  match,
  language,
  t,
}: {
  match: TournamentScheduleMatch;
  language: string;
  t: TFunction;
}) {
  const unknown = t("tournaments.unknownPlayer");
  const teamOneBase = teamSideDisplayName(match, 0, t) || unknown;
  const teamTwoBase = teamSideDisplayName(match, 1, t) || unknown;
  const teamOne = withBracketedElo(
    teamOneBase,
    match.side1,
    (rating) => `(${t("tournaments.matchRatingElo", { value: rating })})`
  );
  const teamTwo = withBracketedElo(
    teamTwoBase,
    match.side2,
    (rating) => `(${t("tournaments.matchRatingElo", { value: rating })})`
  );
  const toneIndex = hashSeed(match.id) % AVATAR_TONES.length;
  const tone = AVATAR_TONES[toneIndex]!;
  const locale = getDateFnsLocale(language) ?? enUS;
  const tbd = t("tournaments.scheduledTbd");
  const { date: dateLabel, time: timeLabel } = matchScheduleDateTimeLabels(match.startTime, locale, tbd);
  const courtLabel = match.court.name ?? t("tournaments.courtTBD");

  const columns = scoreColumns(match);
  const winningSide = aggregateMatchWinner(columns);

  const isLive = match.status === "inProgress";
  const isPendingScore = match.status === "pendingScore";
  const isCancelled = match.status === "cancelled";

  return (
    <article
      className={cn(
        "rounded-[12px] border px-[15px] py-[15px]",
        isLive
          ? "border-green-700 bg-green-50"
          : isPendingScore
            ? "border-amber-700 bg-amber-50"
            : "border-transparent bg-muted/40"
      )}
    >
      <div className="mb-[14px] flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <IconCalendarDays size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{dateLabel}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <IconClock size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{timeLabel}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <IconMap size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{courtLabel}</span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-destructive">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-destructive" />
              {t("tournaments.liveLabel")}
            </span>
          ) : isPendingScore ? (
            <span className="text-[12px] font-medium text-amber-700">{t("tournaments.matchStatusPendingScore")}</span>
          ) : isCancelled ? (
            <span className="text-[12px] font-medium text-destructive">{t("tournaments.matchStatusCancelled")}</span>
          ) : null}
        </div>
      </div>

      <MatchCardReadOnlyRows
        matchId={match.id}
        tone={tone}
        columns={columns}
        rows={[
          {
            name: teamOne,
            side: "one",
            nameSuffix:
              match.status === "completed" && winningSide === "one" ? (
                <span className="shrink-0 text-[13px] font-medium text-green-700">
                  {t("tournaments.matchWinnerParenthetical")}
                </span>
              ) : undefined,
          },
          {
            name: teamTwo,
            side: "two",
            nameSuffix:
              match.status === "completed" && winningSide === "two" ? (
                <span className="shrink-0 text-[13px] font-medium text-green-700">
                  {t("tournaments.matchWinnerParenthetical")}
                </span>
              ) : undefined,
          },
        ]}
      />
    </article>
  );
}

export function PlayerMatchesBoard({
  matches,
  currentUserId,
  language,
  t,
}: PlayerMatchesBoardProps) {
  const [userSelectedMode, setUserSelectedMode] = useState<TournamentScheduleMode | null>(null);
  /** User preference; the filter and switch only apply when signed in (see `onlyMyMatchesActive`). */
  const [wantOnlyMyMatches, setWantOnlyMyMatches] = useState(false);

  const defaultMode: TournamentScheduleMode =
    matches.length === 0 || matches.some((m) => (m.mode ?? "singles") === "singles")
      ? "singles"
      : "doubles";

  const selectedMode: TournamentScheduleMode =
    userSelectedMode && matches.some((m) => (m.mode ?? "singles") === userSelectedMode)
      ? userSelectedMode
      : defaultMode;

  const modeFilteredMatches = matches.filter((match) => (match.mode ?? "singles") === selectedMode);

  const onlyMyMatchesActive = Boolean(currentUserId) && wantOnlyMyMatches;

  const filteredMatches = onlyMyMatchesActive
    ? modeFilteredMatches.filter((match) => isCurrentUserInMatch(match, currentUserId))
    : modeFilteredMatches;

  const emptyText =
    modeFilteredMatches.length === 0
      ? t("tournaments.noMatchesAvailable")
      : t("tournaments.noMyMatchesAvailable");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[20px] font-semibold leading-tight text-foreground">{t("tournaments.allMatches")}</h3>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-[30px] items-center rounded-[6px] bg-muted p-[3px]">
            <button
              type="button"
              onClick={() => {
                setUserSelectedMode("singles");
              }}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-[5px] px-3 text-[12px] font-medium",
                selectedMode === "singles"
                  ? "bg-background text-foreground shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                  : "text-muted-foreground"
              )}
              aria-pressed={selectedMode === "singles"}
            >
              {t("tournaments.scheduleSingles")}
            </button>
            <button
              type="button"
              onClick={() => {
                setUserSelectedMode("doubles");
              }}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-[5px] px-3 text-[12px] font-medium",
                selectedMode === "doubles"
                  ? "bg-background text-foreground shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                  : "text-muted-foreground"
              )}
              aria-pressed={selectedMode === "doubles"}
            >
              {t("tournaments.scheduleDoubles")}
            </button>
          </div>

          <SwitchToggle
            checked={onlyMyMatchesActive}
            onCheckedChange={setWantOnlyMyMatches}
            disabled={!currentUserId}
            className="text-[14px] font-normal text-foreground"
            switchClassName="data-[state=checked]:bg-green-700"
          >
            {t("tournaments.myMatches")}
          </SwitchToggle>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredMatches.map((match) => (
            <PlayerMatchCard key={match.id} match={match} language={language} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
