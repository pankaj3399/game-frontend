import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { TournamentDetail } from "@/hooks/tournament";
import { toast } from "sonner";

type MatchStatus = "completed" | "inProgress" | "scheduled";

interface DerivedMatch {
  id: string;
  playerA: string;
  playerB: string;
  courtName: string;
  status: MatchStatus;
  isMine: boolean;
  scheduledText: string;
}

interface MatchesTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

function participantName(name: string | null, alias: string | null, fallback: string) {
  return name || alias || fallback;
}

function scheduleText(
  date: string | null,
  startTime: string | null,
  tbdLabel: string
) {
  const time = startTime?.trim();

  if (!date) return time ?? tbdLabel;

  try {
    return `${time ?? tbdLabel} (${format(parseISO(date), "yyyy-MM-dd")})`;
  } catch {
    return time ?? tbdLabel;
  }
}

const MATCH_STATUS_KEYS: Record<MatchStatus, string> = {
  completed: "tournaments.matchStatusCompleted",
  inProgress: "tournaments.matchStatusInProgress",
  scheduled: "tournaments.matchStatusScheduled",
};

function statusClassName(status: MatchStatus) {
  if (status === "completed") return "bg-[#dcfce7] text-[#15803d]";
  if (status === "inProgress") return "bg-[#dbeafe] text-[#1d4ed8]";
  return "bg-[#f3f4f6] text-[#6b7280]";
}

function deriveMatches(
  tournament: TournamentDetail,
  currentUserId: string | null,
  t: (key: string) => string
): DerivedMatch[] {
  const pairs = [];
  const participants = tournament.participants;
  const tbdLabel = t("tournaments.scheduledTbd");

  for (let index = 0; index < participants.length; index += 2) {
    const first = participants[index];
    const second = participants[index + 1];
    if (!first) continue;

    const status: MatchStatus = index % 6 === 0 ? "completed" : index % 6 === 2 ? "inProgress" : "scheduled";
    const court = tournament.courts[(index / 2) % Math.max(1, tournament.courts.length)];

    const isMine =
      !!currentUserId &&
      (first.id === currentUserId || (second && second.id === currentUserId));

    pairs.push({
      id: `${first.id}-${second?.id ?? "bye"}`,
      playerA: participantName(first.name, first.alias, t("tournaments.playerAFallback")),
      playerB: participantName(second?.name ?? null, second?.alias ?? null, t("tournaments.playerBFallback")),
      courtName: court?.name || `Court ${Math.floor(index / 2) + 1}`,
      status,
      isMine,
      scheduledText: scheduleText(tournament.date, tournament.startTime, tbdLabel),
    });
  }

  return pairs;
}

function MatchCard({
  match,
  t,
}: {
  match: DerivedMatch;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex gap-1.5">
          <span className="size-5 rounded-full bg-[#e5e7eb]" />
          <span className="size-5 rounded-full bg-[#e5e7eb]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-[#111827]">
            {match.playerA} / {match.playerB}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">{match.scheduledText}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#9ca3af]">
        <span className="font-medium text-[#6b7280]">{t("tournaments.court")}:</span> {match.courtName}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${statusClassName(match.status)}`}>
          {t(MATCH_STATUS_KEYS[match.status])}
        </span>
        <span className="rounded bg-[#111827] px-2 py-0.5 text-[11px] font-semibold text-white">
          {t("tournaments.roundNumber", { round: 1 })}
        </span>
      </div>
    </div>
  );
}

export function MatchesTab({ tournament, currentUserId }: MatchesTabProps) {
  const { t } = useTranslation();
  const [onlyMyMatches, setOnlyMyMatches] = useState(false);

  const matches = useMemo(
    () => deriveMatches(tournament, currentUserId, t),
    [tournament, currentUserId, t]
  );

  const filteredMatches = useMemo(
    () => (onlyMyMatches ? matches.filter((match) => match.isMine) : matches),
    [matches, onlyMyMatches]
  );

  const completedCount = matches.filter((match) => match.status === "completed").length;
  const inProgressCount = matches.filter((match) => match.status === "inProgress").length;
  const scheduledCount = matches.filter((match) => match.status === "scheduled").length;
  const progressPct = matches.length ? Math.round((completedCount / matches.length) * 100) : 0;

  return (
    <TabsContent value="matches" className="mt-6 space-y-5">
      <div className="flex items-center justify-end">
        <Button onClick={()=> toast.info("Coming soon!")} className="h-9 rounded-md bg-[#111827] px-4 text-sm font-medium text-white hover:bg-black">
          {t("tournaments.scheduleGamesRound", { round: 1 })}
        </Button>
      </div>

      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111827]">
            {t("tournaments.tournamentProgressRound", { round: 1 })}
          </h3>
          <p className="text-xs text-[#9ca3af]">
            {t("tournaments.matchesCompletedCount", { completed: completedCount, total: matches.length })}
          </p>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-[#f3f4f6]">
          <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#15803d]">
            <span className="size-2 rounded-full bg-[#16a34a]" />
            {t("tournaments.completedCount", { completed: completedCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#1d4ed8]">
            <span className="size-2 rounded-full bg-[#2563eb]" />
            {t("tournaments.inProgressCount", { inProgress: inProgressCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#6b7280]">
            <span className="size-2 rounded-full bg-[#9ca3af]" />
            {t("tournaments.scheduledCount", { scheduled: scheduledCount })}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold leading-tight text-[#111827]">{t("tournaments.allMatches")}</h3>
          <button
            type="button"
            aria-pressed={onlyMyMatches}
            onClick={() => setOnlyMyMatches((prev) => !prev)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#374151]"
          >
            <span>{t("tournaments.myMatches")}</span>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                onlyMyMatches ? "bg-[#16a34a]" : "bg-[#d1d5db]"
              }`}
            >
              <span
                className={`inline-block size-5 transform rounded-full bg-white transition ${
                  onlyMyMatches ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d1d5db] bg-white p-8 text-sm text-[#6b7280]">
            {matches.length === 0
              ? t("tournaments.noMatchesAvailable")
              : t("tournaments.noMyMatchesAvailable")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} t={t} />
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
