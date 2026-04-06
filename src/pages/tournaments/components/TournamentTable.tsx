import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  TournamentListItem,
  TournamentPagination,
  TournamentStatus,
} from "@/models/tournament";
import { formatDateDisplay } from "@/utils/display";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";

interface TournamentTableProps {
  tournaments: TournamentListItem[];
  pagination: TournamentPagination;
  language: string;
}

export function TournamentTable({
  tournaments,
  pagination,
  language,
}: TournamentTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const STATUS_LABELS: Record<TournamentStatus, string> = {
    active: t("tournaments.statusActive"),
    draft: t("tournaments.statusDraft"),
    inactive: t("tournaments.statusInactive"),
  };
  const STATUS_DOTS: Record<TournamentStatus, string> = {
    active: "bg-emerald-500",
    draft: "bg-amber-400",
    inactive: "bg-muted-foreground/50",
  };

  return (
    <div className="overflow-x-auto border-y border-black/10">
      <Table className="min-w-[860px] table-fixed">
        <TableHeader>
          <TableRow className="h-[35px] border-black/10 bg-black/5 hover:bg-black/5">
            <TableHead className="h-[35px] w-12 px-4 py-0 text-left text-xs font-normal text-foreground/80">
              #
            </TableHead>
            <TableHead className="h-[35px] w-[42%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.tournamentName")}
            </TableHead>
            <TableHead className="h-[35px] w-[38%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.club")}
            </TableHead>
            <TableHead className="h-[35px] w-[20%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.date")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament, idx) => {
            const statusLabel = STATUS_LABELS[tournament.status] || STATUS_LABELS.inactive;
            const statusDotClass = STATUS_DOTS[tournament.status] || STATUS_DOTS.inactive;

            return (
              <TableRow
                key={tournament.id}
                className="h-[45px] cursor-pointer border-black/10 bg-card hover:bg-black/[0.015]"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/tournaments/${tournament.id}`);
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <TableCell className="px-4 py-0 text-xs text-foreground/90">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </TableCell>
                <TableCell className="px-3 py-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-[22px] w-[22px] shrink-0 rounded-[5px] bg-black/15"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm text-foreground">{tournament.name}</span>
                    <span
                      role="img"
                      className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`}
                      aria-label={statusLabel}
                      title={statusLabel}
                    />
                  </div>
                </TableCell>
                <TableCell className="px-3 py-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full bg-black/15"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm text-foreground">
                      {tournament.club?.name ?? "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-0 text-sm text-foreground/90">
                  {formatDateDisplay(
                    tournament.date,
                    t("tournaments.unscheduled"),
                    getDateFnsLocale(language)
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
