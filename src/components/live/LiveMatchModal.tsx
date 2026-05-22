import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IconScanBarcode } from "@/icons/figma-icons";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LiveModalChevronRightIcon from "@/assets/icons/figma/lucide/chevron-right.svg?react";
import LiveModalCourtIcon from "@/assets/icons/figma/lucide/map-pin.svg?react";
import LiveModalXIcon from "@/assets/icons/figma/lucide/x.svg?react";
import LiveModalClockIcon from "@/assets/icons/figma/vuesax/linear/clock.svg?react";
import LiveModalUserIcon from "@/assets/icons/figma/vuesax/linear/user.svg?react";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { TournamentLiveMatchItem } from "@/models/tournament/types";
import { useTournamentLiveMatch, useTournamentMatches } from "@/pages/tournaments/hooks";
import { parseIsoDateSafely } from "@/utils/date";

const LIVE_MATCH_IDLE_REOPEN_MS = 10_000;

function shouldSuppressLiveMatchModal(pathname: string): boolean {
  return pathname === "/record-score" || pathname.startsWith("/record-score/");
}

function playerDisplayName(
  player: { name: string | null; alias: string | null },
  fallback: string
) {
  const hasName = player.name?.trim();
  const hasAlias = player.alias?.trim();
  return hasName ? player.name! : hasAlias ? player.alias! : fallback;
}

function formatMatchTime(startTime: string | null, language: string, fallback: string) {
  const parsed = parseIsoDateSafely(startTime);
  if (!parsed) {
    return fallback;
  }
  const localeTag = getDateFnsLocale(language)?.code ?? language ?? "en-US";
  const dateLabel = new Intl.DateTimeFormat(localeTag, {
    dateStyle: "short",
  }).format(parsed);
  const timeLabel = new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(parsed);
  return `${dateLabel} · ${timeLabel}`;
}

function matchTeamNames(match: TournamentLiveMatchItem, fallback: string) {
  const myTeamNames = match.myTeam
    .map((player, index) => playerDisplayName(player, `${fallback} ${index + 1}`))
    .join(" / ");

  const opponentNames = match.opponentTeam
    .map((player, index) => playerDisplayName(player, `${fallback} ${index + 1}`))
    .join(" / ");

  return {
    myTeamNames: myTeamNames || fallback,
    opponentNames: opponentNames || fallback,
  };
}

type MatchMetaRowProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

function MatchMetaRow({ label, value, icon }: MatchMetaRowProps) {
  return (
    <article className="flex items-start gap-3.5 rounded-[10px] border border-[#e8edf0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="inline-flex size-[22px] shrink-0 items-center justify-center text-[#94a3b8] [&_svg]:size-[22px]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">{label}</p>
        <PlayerNameText
          name={value}
          className="mt-1 text-[16px] font-semibold leading-snug tracking-tight text-[#0f172a]"
          focusable
        />
      </div>
    </article>
  );
}

function LiveMatchEnterScoreButton({
  enterScoreLabel,
  matchId,
  tournamentId,
  onNavigateAway,
}: {
  enterScoreLabel: string;
  matchId: string;
  tournamentId: string | null;
  onNavigateAway: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      variant="brand"
      onClick={() => {
        onNavigateAway();
        const params = new URLSearchParams();
        params.set("matchId", matchId);
        if (tournamentId) {
          params.set("tournamentId", tournamentId);
        }
        const query = params.toString();
        navigate(`/record-score/manual${query ? `?${query}` : ""}`);
      }}
      className="h-11 w-full rounded-[10px]"
    >
      <IconScanBarcode size={18} className="text-white" aria-hidden />
      <span>{enterScoreLabel}</span>
    </Button>
  );
}

export function LiveMatchModal() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [dismissedMatchId, setDismissedMatchId] = useState<string | null>(null);
  const [lastActivityAt, setLastActivityAt] = useState(() => Date.now());
  const isModalSuppressedForRoute = shouldSuppressLiveMatchModal(pathname);

  const liveMatchQuery = useTournamentLiveMatch(!isModalSuppressedForRoute);

  const liveMatch = liveMatchQuery.data?.liveMatch ?? null;
  const nextMatch = liveMatchQuery.data?.nextMatch ?? null;

  useEffect(() => {
    const liveMatchId = liveMatch?.id ?? null;
    if (isModalSuppressedForRoute || liveMatchId == null || dismissedMatchId !== liveMatchId) {
      return;
    }

    const handleActivity = () => setLastActivityAt(Date.now());
    const listenerOptions = { passive: true } as const;
    const activityEvents = ["pointerdown", "touchstart", "keydown", "scroll"] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, listenerOptions);
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [dismissedMatchId, isModalSuppressedForRoute, liveMatch?.id]);

  useEffect(() => {
    const liveMatchId = liveMatch?.id ?? null;
    if (isModalSuppressedForRoute || liveMatchId == null || dismissedMatchId !== liveMatchId) {
      return;
    }

    const elapsedMs = Date.now() - lastActivityAt;
    const remainingMs = Math.max(0, LIVE_MATCH_IDLE_REOPEN_MS - elapsedMs);
    const timeoutId = window.setTimeout(() => {
      setDismissedMatchId((currentDismissedMatchId) =>
        currentDismissedMatchId === liveMatchId ? null : currentDismissedMatchId,
      );
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [dismissedMatchId, isModalSuppressedForRoute, lastActivityAt, liveMatch?.id]);

  const liveTournamentId = liveMatch?.tournament.id ?? null;
  const tournamentMatchesQuery = useTournamentMatches(
    liveTournamentId,
    !isModalSuppressedForRoute && liveTournamentId !== null
  );

  if (isModalSuppressedForRoute) {
    return null;
  }

  const liveTimeLabel = formatMatchTime(
    liveMatch?.startTime ?? null,
    i18n.language,
    t("tournaments.scheduledTbd")
  );

  const nextTimeLabel = formatMatchTime(
    nextMatch?.startTime ?? null,
    i18n.language,
    t("tournaments.scheduledTbd")
  );

  const liveRound =
    !liveMatch ||
    tournamentMatchesQuery.isLoading ||
    tournamentMatchesQuery.isError ||
    !tournamentMatchesQuery.data
      ? null
      : (tournamentMatchesQuery.data.matches.find(
          (match) => match.id === liveMatch.id
        )?.round ?? null);

  const hasTournamentContext = liveMatch != null && liveTournamentId !== null;
  const isRoundDataReady =
    !hasTournamentContext ||
    tournamentMatchesQuery.isSuccess;
  const dialogOpen =
    liveMatch != null &&
    dismissedMatchId !== liveMatch.id &&
    isRoundDataReady;

  if (!liveMatch) {
    return null;
  }

  const liveTeams = matchTeamNames(liveMatch, t("tournaments.playerFallback"));
  const nextTeams = nextMatch
    ? matchTeamNames(nextMatch, t("tournaments.playerFallback"))
    : {
        myTeamNames: "",
        opponentNames: "",
      };

  const nextMatchTimeDisplay = nextMatch
    ? nextTimeLabel
    : t("tournaments.liveModalNoNextMatchTime");
  const nextMatchCourtLabel = nextMatch?.court.name
    ? t("tournaments.liveModalNextMatchCourtValue", { court: nextMatch.court.name })
    : t("tournaments.liveModalNoNextMatchCourt");
  const nextMatchOpponentLabel = nextMatch
    ? t("tournaments.liveModalVersusOpponent", {
        opponent: nextTeams.opponentNames,
      })
    : t("tournaments.liveModalNoNextMatch");
  const liveRoundTournamentLabel =
    liveRound != null
      ? `${t("tournaments.roundNumber", { round: liveRound })} · ${liveMatch.tournament.name}`
      : liveMatch.tournament.name;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLastActivityAt(Date.now());
      setDismissedMatchId(liveMatch.id);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] max-w-[416px] gap-0 overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white p-0 shadow-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("tournaments.liveModalTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-start justify-between border-b border-[#e0e7ff] bg-[#eef2ff] px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1 pr-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              {t("tournaments.liveModalTitle")}
            </p>
            <h2 className="mt-2 text-[20px] font-semibold leading-snug tracking-tight text-[#0f172a]">
              {t("tournaments.liveModalCourtNow")}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="-mr-1 h-9 w-9 shrink-0 rounded-full text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            aria-label={t("common.close")}
          >
            <LiveModalXIcon className="size-5" />
          </Button>
        </div>

        <div className="bg-[#fafbfc] px-4 py-5 sm:px-5">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xl font-semibold leading-none tracking-tight text-[#0f172a]">
                {liveRoundTournamentLabel}
              </p>
              <div className="space-y-2.5">
                <MatchMetaRow
                  label={t("tournaments.liveModalDate")}
                  value={liveTimeLabel}
                  icon={<LiveModalClockIcon className="size-full" />}
                />
                <MatchMetaRow
                  label={t("tournaments.liveModalCourtLabel")}
                  value={liveMatch.court.name ?? t("tournaments.courtTBD")}
                  icon={<LiveModalCourtIcon className="size-full" />}
                />
                <MatchMetaRow
                  label={t("tournaments.liveModalOpponent")}
                  value={liveTeams.opponentNames}
                  icon={<LiveModalUserIcon className="size-full" />}
                />
              </div>
            </div>

            <LiveMatchEnterScoreButton
              enterScoreLabel={t("tournaments.liveModalEnterScore")}
              matchId={liveMatch.id}
              tournamentId={liveTournamentId}
              onNavigateAway={() => handleOpenChange(false)}
            />

            {nextMatch ? (
              <section className="rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-baseline justify-between gap-3 border-b border-[#f1f5f9] pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                    {t("tournaments.liveModalNextMatch")}
                  </p>
                  <p className="text-[13px] font-medium tabular-nums text-[#0f172a]">{nextMatchTimeDisplay}</p>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <PlayerNameText
                      name={nextMatchCourtLabel}
                      className="text-[13px] leading-snug text-[#64748b]"
                      focusable
                    />
                    <PlayerNameText
                      name={nextMatchOpponentLabel}
                      className="text-[16px] font-semibold leading-snug text-[#0f172a]"
                      focusable
                    />
                  </div>
                  <LiveModalChevronRightIcon className="mt-0.5 size-4 shrink-0 text-[#94a3b8]" aria-hidden />
                </div>
              </section>
            ) : (
              <section className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-white px-4 py-5 text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                  {t("tournaments.liveModalNextMatch")}
                </p>
                <p className="mt-2 text-[16px] font-semibold leading-snug tracking-tight text-[#0f172a]">
                  {t("tournaments.liveModalNoNextMatchHeadline")}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
                  {t("tournaments.liveModalNoNextMatchBody")}
                </p>
              </section>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
