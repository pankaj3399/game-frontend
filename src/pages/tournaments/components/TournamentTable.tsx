import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { KeyboardEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  TournamentListItem,
  TournamentPagination,
  TournamentStatus,
} from "@/models/tournament";
import { formatDateDisplay } from "@/utils/display";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { TFunction } from "i18next";

interface TournamentTableProps {
  tournaments: TournamentListItem[];
  pagination: TournamentPagination;
  language: string;
}

const STATUS_DOTS: Record<TournamentStatus, string> = {
  active: "bg-emerald-500",
  draft: "bg-amber-400",
};

export function TournamentTable({
  tournaments,
  pagination,
  language,
}: TournamentTableProps) {
  const { t } = useTranslation();

  function getStatusLabel(status: TournamentStatus, t: TFunction) {
    switch (status) {
      case "active":
        return t("tournaments.statusActive");
      case "draft":
        return t("tournaments.statusDraft");
      default:
        return "";
    }
  }

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
            const statusLabel = getStatusLabel(tournament.status, t);
            const statusDotClass = STATUS_DOTS[tournament.status];
            const rowPath = `/tournaments/${tournament.id}`;

            const openRowTarget = ({
              openInNewTab,
              preventDefault,
            }: {
              openInNewTab: boolean;
              preventDefault?: () => void;
            }) => {
              if (openInNewTab) {
                preventDefault?.();
                window.open(rowPath, "_blank", "noopener,noreferrer");
                return;
              }
              void navigate(rowPath);
            };

            const openRow = (e: MouseEvent<HTMLTableRowElement>) => {
              if (e.defaultPrevented) return;
              if (e.button !== 0) return;
              openRowTarget({
                openInNewTab: e.ctrlKey || e.metaKey,
                preventDefault: () => e.preventDefault(),
              });
            };

            const handleAuxClick = (e: MouseEvent<HTMLTableRowElement>) => {
              if (e.button !== 1) return;
              openRowTarget({
                openInNewTab: true,
                preventDefault: () => e.preventDefault(),
              });
            };

            const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              openRowTarget({
                openInNewTab: e.ctrlKey || e.metaKey,
                preventDefault: () => e.preventDefault(),
              });
            };

            return (
              <TableRow
                key={tournament.id}
                className="h-[45px] border-black/10 bg-card"
              >
                <TableCell colSpan={4} className="p-0">
                  <Link
                    to={rowPath}
                    aria-label={rowAriaLabel}
                    className={cn(
                      "grid h-[45px] w-full grid-cols-[3rem_minmax(0,42fr)_minmax(0,38fr)_minmax(0,20fr)] items-center border-black/10 bg-card text-inherit no-underline transition-colors",
                      "hover:bg-black/[0.015] focus-visible:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
                    )}
                  >
                    <span className="px-4 py-0 text-xs text-foreground/90">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </span>
                    <span className="block min-w-0 px-3 py-0">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-[22px] w-[22px] shrink-0 rounded-[5px] bg-black/15"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm text-foreground">
                          {tournament.name}
                        </span>
                        <span
                          role="img"
                          className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`}
                          aria-label={statusLabel}
                          title={statusLabel}
                        />
                      </span>
                    </span>
                    <span className="block min-w-0 px-3 py-0">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full bg-black/15"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm text-foreground">
                          {tournament.club?.name ?? "-"}
                        </span>
                      </span>
                    </span>
                    <span className="px-3 py-0 text-sm text-foreground/90">
                      {formatDateDisplay(
                        tournament.date,
                        t("tournaments.unscheduled"),
                        getDateFnsLocale(language)
                      )}
                    </span>
                  </Link>
                tabIndex={0}
                className="h-[45px] cursor-pointer border-black/10 bg-card hover:bg-black/[0.015] focus-visible:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/50"
                aria-label={t("tournaments.openTournamentRow", { name: tournament.name })}
                onClick={openRow}
                onAuxClick={handleAuxClick}
                onKeyDown={handleKeyDown}
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
          {tournaments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                {t("tournaments.noTournaments")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
