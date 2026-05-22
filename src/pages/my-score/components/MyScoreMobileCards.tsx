import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import { cn } from "@/lib/utils";
import { formatLiveMatchTeamLabel } from "@/pages/record-score/enter-match-score/helpers";
import type { MyScoreDisplayRow } from "@/pages/my-score/helpers/myScoreRows";
import {
  buildTournamentRecordScorePath,
  matchNeedsRecordScoreShortcut,
} from "@/pages/my-score/helpers/scheduledMatches";
import { MyScoreRecordScoreLink } from "@/pages/my-score/components/MyScoreRecordScoreLink";

interface MyScoreMobileCardsProps {
  rows: MyScoreDisplayRow[];
  formatPlayedAt: (playedAt: string, language: string) => string;
  formatScheduledAt: (startTime: string | null) => string;
  formatScore: (score: number | null) => string;
}

export function MyScoreMobileCards({
  rows,
  formatPlayedAt,
  formatScheduledAt,
  formatScore,
}: MyScoreMobileCardsProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const handlePendingNavigate = () => navigate("/record-score/manual");

  return (
    <div className="space-y-2.5 p-2.5 sm:hidden">
      {rows.map((row) => {
        if (row.kind === "scheduled") {
          const { match } = row;
          const opponent = formatLiveMatchTeamLabel(match.opponentTeam, t);
          const recordPath = buildTournamentRecordScorePath(match);
          const isActionable =
            Boolean(recordPath) && matchNeedsRecordScoreShortcut(match);

          return (
            <Card
              key={`scheduled-${match.id}`}
              className="overflow-hidden rounded-[10px] border border-[#010a04]/8 bg-[#f7f8f7]"
            >
              <CardContent className="space-y-2.5 p-3">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-8 w-8 shrink-0 rounded-[6px] bg-[#cfd3d0]" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#010a04]">
                        {match.tournament.name}
                      </p>
                      <p className="text-[11px] text-[#010a04]/55">
                        {formatScheduledAt(match.startTime)}
                      </p>
                    </div>
                  </div>
                  {isActionable && recordPath ? (
                    <MyScoreRecordScoreLink
                      to={recordPath}
                      label={t("myScorePage.scheduled.recordScoreAriaLabel", {
                        opponent,
                        tournament: match.tournament.name,
                      })}
                      className="shrink-0 pt-0.5"
                    />
                  ) : null}
                </div>

                <Separator className="bg-[#010a04]/8" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[22px] font-semibold leading-none text-[#010a04]">
                      {formatScore(null)}
                    </p>
                    <p className="mt-1 text-[10px] text-[#010a04]/50">
                      {t("myScorePage.table.myScore")}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[22px] font-semibold leading-none text-[#010a04]">
                      {formatScore(null)}
                    </p>
                    <PlayerNameText
                      name={opponent}
                      className="mt-1 text-[10px] text-[#010a04]/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        const { entry } = row;
        const isPending = entry.status === "pendingScore";
        const tournamentDisplay =
          entry.tournament.id == null
            ? t("myScorePage.table.independentMatch")
            : entry.tournament.name;

        return (
          <Card
            key={`mobile-card-${entry.id}`}
            onClick={isPending ? handlePendingNavigate : undefined}
            onKeyDown={
              isPending
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handlePendingNavigate();
                    }
                  }
                : undefined
            }
            tabIndex={isPending ? 0 : undefined}
            role={isPending ? "button" : undefined}
            aria-label={
              isPending
                ? `${t("myScorePage.table.resumeQr")} ${tournamentDisplay}`
                : undefined
            }
            className={cn(
              "overflow-hidden rounded-[10px] border border-[#010a04]/8",
              isPending
                ? "cursor-pointer bg-[#fdfcf5] transition-shadow hover:shadow-[0_4px_14px_rgba(214,171,63,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#067429]/40 focus-visible:ring-offset-2"
                : "bg-[#f7f8f7]",
            )}
          >
            <CardContent className="space-y-2.5 p-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-8 w-8 shrink-0 rounded-[6px] bg-[#cfd3d0]" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#010a04]">
                      {tournamentDisplay}
                    </p>
                    <p className="text-[11px] text-[#010a04]/55">
                      {formatPlayedAt(entry.playedAt, i18n.language)}
                    </p>
                  </div>
                </div>
                {isPending ? (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-[rgba(214,171,63,0.15)] px-2 py-0.5 text-[10px] font-medium text-[#9a7620]">
                    {t("myScorePage.table.pendingConfirmation")}
                  </span>
                ) : null}
              </div>

              <Separator className="bg-[#010a04]/8" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[22px] font-semibold leading-none text-[#010a04]">
                    {formatScore(entry.myScore)}
                  </p>
                  <p className="mt-1 text-[10px] text-[#010a04]/50">
                    {t("myScorePage.table.myScore")}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[22px] font-semibold leading-none text-[#010a04]">
                    {formatScore(entry.opponentScore)}
                  </p>
                  <PlayerNameText
                    name={entry.opponent.name}
                    className="mt-1 text-[10px] text-[#010a04]/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
