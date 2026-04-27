import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MyScoreEntry } from "@/models/myScore/types";

interface MyScoreDesktopTableProps {
  entries: MyScoreEntry[];
  formatPlayedAt: (playedAt: string, language: string) => string;
  formatScore: (score: number | null) => string;
}

export function MyScoreDesktopTable({
  entries,
  formatPlayedAt,
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
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className="border-[#010a04]/8 hover:bg-[#010a04]/[0.015]"
            >
              <TableCell className="px-4 py-2 text-[12px] text-[#010a04]/82">
                {formatPlayedAt(entry.playedAt, i18n.language)}
              </TableCell>
              <TableCell className="px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-5 w-5 shrink-0 rounded-full bg-[#cfd3d0]" />
                  <span className="block truncate text-[12px] font-medium text-[#010a04]">
                    {entry.tournament.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-5 w-5 shrink-0 rounded-full bg-[#cfd3d0]" />
                  <span className="block truncate text-[12px] text-[#010a04]/85">
                    {entry.opponent.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-2 text-[12px] font-medium text-[#010a04]">
                {formatScore(entry.myScore)}
              </TableCell>
              <TableCell className="px-4 py-2 text-[12px] font-medium text-[#010a04]">
                {formatScore(entry.opponentScore)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
