import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import { cn } from "@/lib/utils";
import { formatLiveMatchTeamLabel } from "@/pages/record-score/enter-match-score/helpers";
import type { MyScoreDisplayRow } from "@/pages/my-score/helpers/myScoreRows";
import {
  buildTournamentRecordScorePath,
  matchNeedsRecordScoreShortcut,
} from "@/pages/my-score/helpers/scheduledMatches";
import { MyScoreRecordScoreLink } from "@/pages/my-score/components/MyScoreRecordScoreLink";

interface MyScoreDesktopTableProps {
  rows: MyScoreDisplayRow[];
  formatPlayedAt: (playedAt: string, language: string) => string;
  formatScheduledAt: (startTime: string | null) => string;
  formatScore: (score: number | null) => string;
}

export function MyScoreDesktopTable({
  rows,
  formatPlayedAt,
  formatScheduledAt,
  formatScore,
}: MyScoreDesktopTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="hidden sm:block">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[140px]" />
          <col className="w-[31%]" />
          <col className="w-[29%]" />
          <col className="w-[95px]" />
          <col className="w-[120px]" />
        </colgroup>

        <TableHeader className="bg-[#010a04]/[0.03]">
          <TableRow className="border-[#010a04]/8 hover:bg-transparent">
            <TableHead className="px-4 py-2 text-[10px] font-medium text-[#010a04]/55">
              {t("myScorePage.table.date")}
            </TableHead>
            <TableHead className="px-4 py-2 text-[10px] font-medium text-[#010a04]/55">
              {t("myScorePage.table.tournament")}
            </TableHead>
            <TableHead className="px-4 py-2 text-[10px] font-medium text-[#010a04]/55">
              {t("myScorePage.table.opponent")}
            </TableHead>
            <TableHead className="px-4 py-2 text-[10px] font-medium text-[#010a04]/55">
              {t("myScorePage.table.myScore")}
            </TableHead>
            <TableHead className="px-4 py-2 text-[10px] font-medium text-[#010a04]/55">
              {t("myScorePage.table.opponentScore")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            if (row.kind === "scheduled") {
              const { match } = row;
              const opponent = formatLiveMatchTeamLabel(match.opponentTeam, t);
              const recordPath = buildTournamentRecordScorePath(match);
              const isActionable =
                Boolean(recordPath) && matchNeedsRecordScoreShortcut(match);

              return (
                <TableRow
                  key={`scheduled-${match.id}`}
                  className="border-[#010a04]/8 hover:bg-[#010a04]/[0.015]"
                >
                  <TableCell className="px-4 py-2 text-[12px] text-[#010a04]/82">
                    {formatScheduledAt(match.startTime)}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-[#cfd3d0]" />
                      <span className="block truncate text-[12px] font-medium text-[#010a04]">
                        {match.tournament.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-[#cfd3d0]" />
                      <PlayerNameText
                        name={opponent}
                        className="min-w-0 flex-1 truncate text-[12px] text-[#010a04]/85"
                      />
                      {isActionable && recordPath ? (
                        <MyScoreRecordScoreLink
                          to={recordPath}
                          label={t("myScorePage.scheduled.recordScoreAriaLabel", {
                            opponent,
                            tournament: match.tournament.name,
                          })}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-[12px] font-medium text-[#010a04]">
                    {formatScore(null)}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-[12px] font-medium text-[#010a04]">
                    {formatScore(null)}
                  </TableCell>
                </TableRow>
              );
            }

            const { entry } = row;
            const isPending = entry.status === "pendingScore";
            const tournamentDisplay =
              entry.tournament.id == null
                ? t("myScorePage.table.independentMatch")
                : entry.tournament.name;

            return (
              <TableRow
                key={entry.id}
                className={cn(
                  "border-[#010a04]/8",
                  isPending
                    ? "hover:bg-[rgba(6,116,41,0.04)]"
                    : "hover:bg-[#010a04]/[0.015]",
                )}
              >
                <TableCell className="px-4 py-2 text-[12px] text-[#010a04]/82">
                  {formatPlayedAt(entry.playedAt, i18n.language)}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-5 w-5 shrink-0 rounded-full bg-[#cfd3d0]" />
                    <span className="block truncate text-[12px] font-medium text-[#010a04]">
                      {tournamentDisplay}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-[#cfd3d0]" />
                      <span className="block truncate text-[12px] text-[#010a04]/85">
                        {entry.opponent.name}
                      </span>
                    </div>
                    {isPending ? (
                      <div className="ml-7 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[rgba(214,171,63,0.15)] px-1.5 py-0.5 text-[10px] font-medium text-[#9a7620]">
                          {t("myScorePage.table.pendingConfirmation")}
                        </span>
                        <Link
                          to="/record-score/manual"
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-[#067429] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#067429]/40"
                          aria-label={`${t("myScorePage.table.resumeQr")} ${tournamentDisplay}`}
                        >
                          {t("myScorePage.table.resumeQr")}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2 text-[12px] font-medium text-[#010a04]">
                  {formatScore(entry.myScore)}
                </TableCell>
                <TableCell className="px-4 py-2 text-[12px] font-medium text-[#010a04]">
                  {formatScore(entry.opponentScore)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
