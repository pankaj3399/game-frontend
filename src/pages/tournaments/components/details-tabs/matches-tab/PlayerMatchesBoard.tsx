import { useState, useMemo } from "react";
import { enUS } from "date-fns/locale";
import type { TFunction } from "i18next";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { cn } from "@/lib/utils";
import type { TournamentScheduleMatch, TournamentScheduleMode } from "@/models/tournament/types";
import { MatchScheduleCard } from "@/pages/tournaments/schedule/components/MatchScheduleCard";

interface PlayerMatchesBoardProps {
  matches: TournamentScheduleMatch[];
  currentUserId: string | null;
  language: string;
  timeZone?: string | null;
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

export function PlayerMatchesBoard({
  matches,
  currentUserId,
  language,
  timeZone,
  t,
}: PlayerMatchesBoardProps) {
  const [userSelectedMode, setUserSelectedMode] = useState<TournamentScheduleMode | null>(null);
  /** User preference; the filter and switch only apply when signed in (see `onlyMyMatchesActive`). */
  const [wantOnlyMyMatches, setWantOnlyMyMatches] = useState(false);
  const locale = getDateFnsLocale(language) ?? enUS;

  const defaultMode: TournamentScheduleMode =
    matches.length === 0 || matches.some((m) => (m.mode ?? "singles") === "singles")
      ? "singles"
      : "doubles";

  const selectedMode: TournamentScheduleMode =
    userSelectedMode && matches.some((m) => (m.mode ?? "singles") === userSelectedMode)
      ? userSelectedMode
      : defaultMode;
  const singlesAvailable = matches.some((m) => (m.mode ?? "singles") === "singles");
  const doublesAvailable = matches.some((m) => (m.mode ?? "singles") === "doubles");

  const sortedMatches = useMemo(() => {
    return matches.slice().sort((left, right) => {
      // Real matches first, historical/rescheduled matches last
      const leftIsHistorical = left.detachedFromRound != null;
      const rightIsHistorical = right.detachedFromRound != null;
      if (leftIsHistorical !== rightIsHistorical) {
        return leftIsHistorical ? 1 : -1;
      }
      // Within same category, cancelled matches go after non-cancelled
      if (left.status === "cancelled" && right.status !== "cancelled") return 1;
      if (left.status !== "cancelled" && right.status === "cancelled") return -1;
      // Then sort by round
      if (left.round !== right.round) return left.round - right.round;
      // Finally by slot
      return left.slot - right.slot;
    });
  }, [matches]);

  const modeFilteredMatches = sortedMatches.filter((match) => (match.mode ?? "singles") === selectedMode);

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
              disabled={!singlesAvailable}
              aria-disabled={!singlesAvailable ? "true" : undefined}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-[5px] px-3 text-[12px] font-medium",
                !singlesAvailable && "cursor-not-allowed opacity-50",
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
              disabled={!doublesAvailable}
              aria-disabled={!doublesAvailable ? "true" : undefined}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-[5px] px-3 text-[12px] font-medium",
                !doublesAvailable && "cursor-not-allowed opacity-50",
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
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredMatches.map((match) => (
            <MatchScheduleCard
              key={match.id}
              match={match}
              locale={locale}
              timeZone={timeZone}
              t={t}
              canEditScores={false}
              isEditing={false}
              editableRows={[]}
              isSavePending={false}
              saveErrorMessage={null}
              onToggleEdit={() => {}}
              onScoreInputChange={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
