import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import type { TFunction } from "i18next";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { cn } from "@/lib/utils";
import type {
  TournamentMatchPlayer,
  TournamentScheduleMatch,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import { IconCalendarDays, IconChevronRight, IconMap } from "@/icons/figma-icons";

const AVATAR_TONES = [
  "from-[#f7d4bf] to-[#efb598]",
  "from-[#d5e5f6] to-[#acc8e7]",
  "from-[#d9efdd] to-[#b9dfc4]",
  "from-[#f7e5bb] to-[#efd587]",
  "from-[#e8ddfb] to-[#cab6ef]",
  "from-[#ffd8e0] to-[#f4b3c2]",
];

type ScoreValue = number | "wo";
type WinnerSide = "one" | "two" | null;

interface PlayerMatchesBoardProps {
  tournamentId: string;
  matches: TournamentScheduleMatch[];
  currentUserId: string | null;
  language: string;
  t: TFunction;
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return (hash >>> 0) % 2147483647;
}

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

function matchPlayerName(player: TournamentMatchPlayer | null, fallback: string): string {
  if (!player) {
    return fallback;
  }

  return player.name ?? player.alias ?? fallback;
}

function matchDateLabel(startTime: string | null, fallback: string, language: string): string {
  if (!startTime) {
    return fallback;
  }

  const parsed = parseISO(startTime);
  if (!isValid(parsed)) {
    return fallback;
  }

  return format(parsed, "EEE, MMM d", {
    locale: getDateFnsLocale(language),
  });
}

function compareScoreValue(
  playerOne: ScoreValue | undefined,
  playerTwo: ScoreValue | undefined
): number {
  if (playerOne == null || playerTwo == null) {
    return 0;
  }

  if (playerOne === "wo" && playerTwo === "wo") {
    return 0;
  }

  if (playerOne === "wo") {
    return -1;
  }

  if (playerTwo === "wo") {
    return 1;
  }

  if (playerOne === playerTwo) {
    return 0;
  }

  return playerOne > playerTwo ? 1 : -1;
}

function isCurrentUserInMatch(match: TournamentScheduleMatch, currentUserId: string | null): boolean {
  if (!currentUserId) {
    return false;
  }

  const directPlayers = match.players.some((player) => player?.id === currentUserId);
  if (directPlayers) {
    return true;
  }

  if (!match.teams) {
    return false;
  }

  for (const team of match.teams) {
    for (const player of team) {
      if (player?.id === currentUserId) {
        return true;
      }
    }
  }

  return false;
}

function getTeamDisplayName(
  match: TournamentScheduleMatch,
  teamIndex: 0 | 1,
  t: TFunction
): string {
  const teamPlayers = match.teams?.[teamIndex];
  if (teamPlayers) {
    const names = teamPlayers
      .map((player, index) =>
        matchPlayerName(
          player,
          index === 0 ? t("tournaments.playerAFallback") : t("tournaments.playerBFallback")
        )
      )
      .filter((name) => name.trim().length > 0);

    if (names.length >= 2) {
      return `${names[0]} / ${names[1]}`;
    }

    if (names.length === 1) {
      return names[0];
    }
  }

  const fallback = teamIndex === 0 ? t("tournaments.playerAFallback") : t("tournaments.playerBFallback");
  return matchPlayerName(match.players[teamIndex], fallback);
}

function scoreText(value: ScoreValue | undefined): string {
  if (value == null) {
    return "";
  }
  if (value === "wo") {
    return "WO";
  }
  return String(value);
}

function scoreCellClass(winner: WinnerSide, side: "one" | "two", hasValue: boolean): string {
  if (!hasValue) {
    return "bg-[#dce2de] text-transparent";
  }

  if (winner === side) {
    return "bg-[#010a04] text-white";
  }

  return "bg-[rgba(0,0,0,0.08)] text-[#010a04]";
}

function PlayerMatchCard({
  match,
  language,
  tournamentId,
  t,
}: {
  match: TournamentScheduleMatch;
  language: string;
  tournamentId: string;
  t: TFunction;
}) {
  const navigate = useNavigate();
  const teamOne = getTeamDisplayName(match, 0, t);
  const teamTwo = getTeamDisplayName(match, 1, t);
  const toneIndex = hashSeed(match.id) % AVATAR_TONES.length;
  const tone = AVATAR_TONES[toneIndex]!;
  const dateLabel = matchDateLabel(match.startTime, t("tournaments.scheduledTbd"), language);
  const courtLabel = match.court.name ?? t("tournaments.courtTBD");

  const playerOneScores = match.score.playerOneScores;
  const playerTwoScores = match.score.playerTwoScores;
  const scoreColumnCount = Math.max(3, playerOneScores.length, playerTwoScores.length);
  const scoreColumns = Array.from({ length: scoreColumnCount }, (_, index) => {
    const playerOne = playerOneScores[index];
    const playerTwo = playerTwoScores[index];
    const comparison = compareScoreValue(playerOne, playerTwo);
    const winner: WinnerSide = comparison > 0 ? "one" : comparison < 0 ? "two" : null;
    return { playerOne, playerTwo, winner };
  });
  const hasScoreData = scoreColumns.some(
    (column) => column.playerOne != null || column.playerTwo != null
  );

  const round = Math.max(1, match.round);
  const goToSchedule = () => {
    navigate(`/tournaments/${tournamentId}/schedule?round=${round}`);
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToSchedule();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={t("tournaments.viewMatchAria", { id: match.id })}
      onClick={goToSchedule}
      onKeyDown={onCardKeyDown}
      className={cn(
        "cursor-pointer rounded-[12px] bg-[rgba(1,10,4,0.04)] px-[15px] py-[15px] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#010a04]/25",
        match.status === "inProgress" && "border border-[#16a34a]"
      )}
    >
      <div className="mb-[15px] flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-[16px] text-[14px] text-[#6a6a6a]">
          <span className="inline-flex min-w-0 items-center gap-[6px]">
            <IconCalendarDays size={16} className="shrink-0 text-[#6a6a6a]" />
            <span className="truncate">{dateLabel}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-[6px]">
            <IconMap size={16} className="shrink-0 text-[#6a6a6a]" />
            <span className="truncate">{courtLabel}</span>
          </span>
          {match.status === "inProgress" ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#d92100]">
              <span className="inline-block size-[6px] rounded-full bg-[#d92100]" />
              {t("tournaments.liveLabel")}
            </span>
          ) : null}
        </div>
        <IconChevronRight size={16} className="shrink-0 text-[#010a04]/70" />
      </div>

      <div className="space-y-[10px]">
        {[
          { key: "team-one", name: teamOne, side: "one" as const },
          { key: "team-two", name: teamTwo, side: "two" as const },
        ].map((row) => (
          <div key={`${match.id}-${row.key}`} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-[15px]">
              <span
                className={`flex size-[30px] shrink-0 items-center justify-center rounded-[20px] border-2 border-[#eef1ee] bg-gradient-to-br ${tone} text-[11px] font-semibold text-[#010a04]/80`}
              >
                {initialsFromName(row.name)}
              </span>
              <span className="truncate text-[16px] font-medium leading-[20px] text-[#010a04]">{row.name}</span>
            </div>

            {hasScoreData ? (
              <div className="flex items-center gap-[6px]">
                {scoreColumns.map((column, index) => {
                  const value = row.side === "one" ? column.playerOne : column.playerTwo;
                  return (
                    <span
                      key={`${match.id}-${row.side}-${index}`}
                      className={cn(
                        "inline-flex size-[32px] items-center justify-center rounded-[5px] text-[14px] font-medium",
                        scoreCellClass(column.winner, row.side, value != null)
                      )}
                    >
                      {scoreText(value)}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

export function PlayerMatchesBoard({
  tournamentId,
  matches,
  currentUserId,
  language,
  t,
}: PlayerMatchesBoardProps) {
  const [selectedMode, setSelectedMode] = useState<TournamentScheduleMode>(() => {
    if (matches.length === 0) {
      return "singles";
    }
    return matches.some((m) => (m.mode ?? "singles") === "singles") ? "singles" : "doubles";
  });
  /** User preference; the filter and switch only apply when signed in (see `onlyMyMatchesActive`). */
  const [wantOnlyMyMatches, setWantOnlyMyMatches] = useState(false);

  const modeFilteredMatches = useMemo(
    () => matches.filter((match) => (match.mode ?? "singles") === selectedMode),
    [matches, selectedMode]
  );

  const onlyMyMatchesActive = Boolean(currentUserId) && wantOnlyMyMatches;

  const filteredMatches = useMemo(
    () =>
      onlyMyMatchesActive
        ? modeFilteredMatches.filter((match) => isCurrentUserInMatch(match, currentUserId))
        : modeFilteredMatches,
    [modeFilteredMatches, onlyMyMatchesActive, currentUserId]
  );

  const emptyText =
    modeFilteredMatches.length === 0
      ? t("tournaments.noMatchesAvailable")
      : t("tournaments.noMyMatchesAvailable");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[20px] font-semibold leading-tight text-[#010a04]">{t("tournaments.allMatches")}</h3>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-[30px] items-center rounded-[6px] bg-[rgba(1,10,4,0.05)] p-[3px]">
            <button
              type="button"
              onClick={() => setSelectedMode("singles")}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-[5px] px-3 text-[12px] font-medium",
                selectedMode === "singles"
                  ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                  : "text-[#010a04]/70"
              )}
              aria-pressed={selectedMode === "singles"}
            >
              {t("tournaments.scheduleSingles")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("doubles")}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-[5px] px-3 text-[12px] font-medium",
                selectedMode === "doubles"
                  ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                  : "text-[#010a04]/70"
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
            className="text-[14px] font-normal text-[#010a04]"
            switchClassName="data-[state=checked]:bg-[#067429]"
          >
            {t("tournaments.myMatches")}
          </SwitchToggle>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d1d5db] bg-white p-8 text-sm text-[#6b7280]">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredMatches.map((match) => (
            <PlayerMatchCard
              key={match.id}
              match={match}
              language={language}
              tournamentId={tournamentId}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
