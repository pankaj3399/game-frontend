import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { getErrorMessage } from "@/lib/errors";
import { IconClock, IconMap, IconX } from "@/icons/figma-icons";
import type { TournamentLiveMatchItem } from "@/models/tournament/types";
import {
  useRecordTournamentMatchScore,
  useTournamentLiveMatch,
} from "@/pages/tournaments/hooks";
function playerDisplayName(
  player: { name: string | null; alias: string | null },
  fallback: string
) {
  return player.name ?? player.alias ?? fallback;
}

function formatStartTime(startTime: string | null, language: string, fallback: string) {
  if (!startTime) {
    return fallback;
  }

  const parsed = parseISO(startTime);
  if (!isValid(parsed)) {
    return fallback;
  }

  return format(parsed, "EEE, MMM d - HH:mm", {
    locale: getDateFnsLocale(language),
  });
}

function TeamLine({
  label,
  names,
}: {
  label: string;
  names: string;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6a6a6a]">
        {label}
      </span>
      <p className="text-[15px] font-medium leading-tight text-[#010a04]">{names}</p>
    </div>
  );
}

function matchTeamNames(match: TournamentLiveMatchItem, fallback: string) {
  const myTeamNames = match.myTeam
    .map((player, index) => playerDisplayName(player, `${fallback} ${index + 1}`))
    .join(" / ");
  const opponentNames = match.opponentTeam
    .map((player, index) => playerDisplayName(player, `${fallback} ${index + 1}`))
    .join(" / ");

  return {
    myTeamNames,
    opponentNames,
  };
}

type RecordScoreMutation = ReturnType<typeof useRecordTournamentMatchScore>;

function LiveMatchScoringBlock({
  liveMatch,
  t,
  recordScoreMutation,
  onScoreSaved,
}: {
  liveMatch: TournamentLiveMatchItem;
  t: (key: string) => string;
  recordScoreMutation: RecordScoreMutation;
  onScoreSaved: () => void;
}) {
  const [isScoring, setIsScoring] = useState(false);
  const [myTeamScore, setMyTeamScore] = useState("");
  const [opponentTeamScore, setOpponentTeamScore] = useState("");

  const handleScoreSubmit = async () => {
    const myRaw = myTeamScore.trim();
    const opponentRaw = opponentTeamScore.trim();
    const digitsOnly = /^\d+$/;

    if (!digitsOnly.test(myRaw) || !digitsOnly.test(opponentRaw)) {
      toast.error(t("tournaments.liveModalInvalidScore"));
      return;
    }

    const myScoreValue = Number.parseInt(myRaw, 10);
    const opponentScoreValue = Number.parseInt(opponentRaw, 10);

    try {
      await recordScoreMutation.mutateAsync({
        tournamentId: liveMatch.tournament.id,
        matchId: liveMatch.id,
        input: {
          playerOneScores: [myScoreValue],
          playerTwoScores: [opponentScoreValue],
        },
      });

      toast.success(t("tournaments.liveModalScoreSaved"));
      onScoreSaved();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) ?? t("tournaments.liveModalScoreSaveError")
      );
    }
  };

  const isSubmitting = recordScoreMutation.isPending;

  return (
    <>
      {isScoring ? (
        <div className="rounded-[12px] border border-[#067429]/30 bg-[#f4fbf6] p-3">
          <p className="text-[14px] font-semibold text-[#010a04]">
            {t("tournaments.liveModalScoreTitle")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[12px] text-[#4f5a53]">
              {t("tournaments.liveModalMyTeam")}
              <input
                type="number"
                min={0}
                step={1}
                value={myTeamScore}
                onChange={(event) => setMyTeamScore(event.target.value)}
                className="h-9 rounded-md border border-[#cfd8d2] bg-white px-2 text-[14px] text-[#010a04] outline-none transition focus:border-[#067429]"
              />
            </label>
            <label className="grid gap-1 text-[12px] text-[#4f5a53]">
              {t("tournaments.liveModalOpponent")}
              <input
                type="number"
                min={0}
                step={1}
                value={opponentTeamScore}
                onChange={(event) => setOpponentTeamScore(event.target.value)}
                className="h-9 rounded-md border border-[#cfd8d2] bg-white px-2 text-[14px] text-[#010a04] outline-none transition focus:border-[#067429]"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScoring(false)}
              disabled={isSubmitting}
              className="h-9"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleScoreSubmit()}
              disabled={isSubmitting}
              className="h-9 bg-[#067429] text-white hover:bg-[#055c21]"
            >
              {isSubmitting
                ? t("tournaments.liveModalSaving")
                : t("tournaments.liveModalSaveScore")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsScoring(true)}
          className="h-10 w-full bg-[#067429] text-[14px] font-semibold text-white hover:bg-[#055c21]"
        >
          {t("tournaments.liveModalEnterScore")}
        </Button>
      )}
    </>
  );
}

export function LiveMatchModal() {
  const { t, i18n } = useTranslation();
  const [dismissedMatchId, setDismissedMatchId] = useState<string | null>(null);

  const liveMatchQuery = useTournamentLiveMatch(true);
  const recordScoreMutation = useRecordTournamentMatchScore();

  const liveMatch = liveMatchQuery.data?.liveMatch ?? null;
  const nextMatch = liveMatchQuery.data?.nextMatch ?? null;

  const dialogOpen =
    liveMatch != null && dismissedMatchId !== liveMatch.id;

  const liveTimeLabel = useMemo(
    () =>
      formatStartTime(
        liveMatch?.startTime ?? null,
        i18n.language,
        t("tournaments.scheduledTbd")
      ),
    [i18n.language, liveMatch?.startTime, t]
  );

  const nextTimeLabel = useMemo(
    () =>
      formatStartTime(
        nextMatch?.startTime ?? null,
        i18n.language,
        t("tournaments.scheduledTbd")
      ),
    [i18n.language, nextMatch?.startTime, t]
  );

  if (!liveMatch) {
    return null;
  }

  const liveTeams = matchTeamNames(liveMatch, t("tournaments.playerFallback"));
  const nextTeams = nextMatch
    ? matchTeamNames(nextMatch, t("tournaments.playerFallback"))
    : null;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDismissedMatchId(liveMatch.id);
    }
  };

  const handleScoreSaved = () => {
    setDismissedMatchId(liveMatch.id);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[92vw] max-w-[460px] gap-0 overflow-hidden rounded-[14px] border border-[#010a04]/10 p-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("tournaments.liveModalTitle")}</DialogTitle>
        </DialogHeader>

        <div className="rounded-t-[14px] bg-[#067429] px-4 py-3 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] uppercase tracking-[0.08em] text-white/80">
                {t("tournaments.liveLabel")}
              </p>
              <h2 className="text-[17px] font-semibold leading-tight">
                {t("tournaments.liveModalTitle")}
              </h2>
              <p className="mt-0.5 text-[13px] text-white/90">
                {t("tournaments.liveModalDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="h-8 w-8 shrink-0 rounded-full text-white hover:bg-white/15"
              aria-label={t("common.close")}
            >
              <IconX size={16} className="text-white" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 bg-white px-4 py-4">
          <div className="rounded-[12px] border border-[#010a04]/10 bg-[#f8faf8] p-3">
            <p className="truncate text-[14px] font-semibold text-[#010a04]">
              {liveMatch.tournament.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#5c645f]">
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={14} className="text-[#5c645f]" />
                {liveTimeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconMap size={14} className="text-[#5c645f]" />
                {liveMatch.court.name ?? t("tournaments.courtTBD")}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              <TeamLine
                label={t("tournaments.liveModalMyTeam")}
                names={liveTeams.myTeamNames}
              />
              <TeamLine
                label={t("tournaments.liveModalOpponent")}
                names={liveTeams.opponentNames}
              />
            </div>
          </div>

          <LiveMatchScoringBlock
            key={liveMatch.id}
            liveMatch={liveMatch}
            t={t}
            recordScoreMutation={recordScoreMutation}
            onScoreSaved={handleScoreSaved}
          />

          {nextMatch && nextTeams ? (
            <div className="rounded-[12px] border border-[#010a04]/10 bg-[#f7f8fa] p-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6a6a6a]">
                {t("tournaments.liveModalNextMatch")}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#010a04]">
                {nextMatch.tournament.name}
              </p>
              <p className="mt-1 text-[13px] text-[#5c645f]">{nextTimeLabel}</p>
              <p className="mt-2 text-[13px] text-[#2b352e]">{nextTeams.opponentNames}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
