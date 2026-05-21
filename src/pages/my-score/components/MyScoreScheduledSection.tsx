import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TournamentLiveMatchItem } from "@/models/tournament/types";
import { formatLiveMatchTeamLabel } from "@/pages/record-score/enter-match-score/helpers";
import {
  buildTournamentRecordScorePath,
  matchNeedsRecordScoreShortcut,
} from "../helpers/scheduledMatches";

interface MyScoreScheduledSectionProps {
  matches: TournamentLiveMatchItem[];
  formatStartTime: (startTime: string | null) => string;
  isLoading?: boolean;
}

function statusLabelKey(
  status: TournamentLiveMatchItem["status"]
): "scheduled" | "inProgress" | "pendingScore" {
  if (status === "inProgress") {
    return "inProgress";
  }
  if (status === "pendingScore") {
    return "pendingScore";
  }
  return "scheduled";
}

function StatusBadge({ status }: { status: TournamentLiveMatchItem["status"] }) {
  const { t } = useTranslation();
  const key = statusLabelKey(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        key === "inProgress" && "bg-[rgba(6,116,41,0.12)] text-[#067429]",
        key === "pendingScore" && "bg-[rgba(214,171,63,0.15)] text-[#9a7620]",
        key === "scheduled" && "bg-[#010a04]/[0.06] text-[#010a04]/70",
      )}
    >
      {t(`myScorePage.scheduled.status.${key}`)}
    </span>
  );
}

function RecordScoreAction({ match }: { match: TournamentLiveMatchItem }) {
  const { t } = useTranslation();
  const path = buildTournamentRecordScorePath(match);

  if (!path || !matchNeedsRecordScoreShortcut(match)) {
    return <span className="text-[12px] text-[#010a04]/40">—</span>;
  }

  return (
    <Button
      variant="brand"
      size="sm"
      className="h-8 rounded-[7px] px-3 text-[12px] font-medium"
      asChild
    >
      <Link to={path}>{t("myScorePage.scheduled.recordScore")}</Link>
    </Button>
  );
}

function ScheduledMatchRowContent({
  match,
  formatStartTime,
}: {
  match: TournamentLiveMatchItem;
  formatStartTime: (startTime: string | null) => string;
}) {
  const { t } = useTranslation();
  const opponent = formatLiveMatchTeamLabel(match.opponentTeam, t);
  const roundLabel =
    match.round != null
      ? t("tournaments.roundNumber", { round: match.round })
      : t("tournaments.liveModalRoundPending");

  return (
    <>
      <p className="truncate text-[13px] font-semibold text-[#010a04]">
        {match.tournament.name}
      </p>
      <p className="text-[11px] text-[#010a04]/55">
        {roundLabel}
        {match.court.name ? ` · ${match.court.name}` : ""}
      </p>
      <p className="text-[11px] text-[#010a04]/55">{formatStartTime(match.startTime)}</p>
      <PlayerNameText name={opponent} className="text-[12px] text-[#010a04]/85" />
    </>
  );
}

export function MyScoreScheduledSection({
  matches,
  formatStartTime,
  isLoading = false,
}: MyScoreScheduledSectionProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-[10px] border border-[#010a04]/10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <CardHeader className="px-4 py-3 sm:px-5">
          <CardTitle className="text-[18px] font-semibold text-[#010a04]">
            {t("myScorePage.scheduled.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5">
          <p className="text-[13px] text-[#010a04]/55">{t("myScorePage.scheduled.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden rounded-[10px] border border-[#010a04]/10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <CardHeader className="px-4 py-3 sm:px-5">
        <CardTitle className="text-[18px] font-semibold text-[#010a04]">
          {t("myScorePage.scheduled.title")}
        </CardTitle>
        <p className="text-[12px] leading-relaxed text-[#010a04]/55">
          {t("myScorePage.scheduled.hint")}
        </p>
      </CardHeader>

      <CardContent className="space-y-2.5 p-0 pb-2.5 sm:pb-0">
        <div className="space-y-2.5 px-2.5 sm:hidden">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-[10px] border border-[#010a04]/8 bg-[#f7f8f7] p-3"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <StatusBadge status={match.status} />
                <RecordScoreAction match={match} />
              </div>
              <ScheduledMatchRowContent match={match} formatStartTime={formatStartTime} />
            </div>
          ))}
        </div>

        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#010a04]/[0.04] hover:bg-[#010a04]/[0.04]">
                <TableHead className="text-[12px] font-normal text-[#010a04]/70">
                  {t("myScorePage.scheduled.columns.when")}
                </TableHead>
                <TableHead className="text-[12px] font-normal text-[#010a04]/70">
                  {t("myScorePage.table.tournament")}
                </TableHead>
                <TableHead className="text-[12px] font-normal text-[#010a04]/70">
                  {t("myScorePage.table.opponent")}
                </TableHead>
                <TableHead className="text-[12px] font-normal text-[#010a04]/70">
                  {t("myScorePage.scheduled.columns.status")}
                </TableHead>
                <TableHead className="w-[140px] text-[12px] font-normal text-[#010a04]/70">
                  {t("myScorePage.scheduled.columns.action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => {
                const opponent = formatLiveMatchTeamLabel(match.opponentTeam, t);
                const roundLabel =
                  match.round != null
                    ? t("tournaments.roundNumber", { round: match.round })
                    : t("tournaments.liveModalRoundPending");

                return (
                  <TableRow key={match.id} className="border-[#010a04]/8">
                    <TableCell className="px-4 py-2 text-[12px] text-[#010a04]/82">
                      <div>{formatStartTime(match.startTime)}</div>
                      {match.court.name ? (
                        <div className="text-[11px] text-[#010a04]/50">{match.court.name}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="text-[12px] font-medium text-[#010a04]">
                        {match.tournament.name}
                      </div>
                      <div className="text-[11px] text-[#010a04]/55">{roundLabel}</div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <PlayerNameText
                        name={opponent}
                        className="text-[12px] text-[#010a04]/85"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <StatusBadge status={match.status} />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <RecordScoreAction match={match} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
