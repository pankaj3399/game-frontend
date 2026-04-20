import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Calendar, EyeIcon, PencilEdit01Icon } from "@/icons/figma-icons";
import {
  Table,
  TableBody,
  TableCaption,
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
  listHeading: string;
}

const STATUS_DOTS: Record<TournamentStatus, string> = {
  active: "bg-emerald-500",
  draft: "bg-amber-400",
};

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

function buildTournamentRowViewModel(
  tournament: TournamentListItem,
  t: TFunction,
  language: string
) {
  return {
    id: tournament.id,
    name: tournament.name,
    statusLabel: getStatusLabel(tournament.status, t),
    statusDotClass: STATUS_DOTS[tournament.status],
    rowPath: `/tournaments/${tournament.id}`,
    dateText: formatDateDisplay(
      tournament.date,
      t("tournaments.unscheduled"),
      getDateFnsLocale(language)
    ),
    isDraft: tournament.status === "draft",
    clubName: tournament.club?.name ?? "-",
  };
}

export function TournamentTable({
  tournaments,
  pagination,
  language,
  listHeading,
}: TournamentTableProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="px-4 pb-4 sm:px-5 lg:hidden" role="list" aria-label={listHeading}>
        <div className="flex flex-col gap-[15px]">
          {tournaments.map((tournament) => {
            const row = buildTournamentRowViewModel(tournament, t, language);

            return (
              <div key={row.id} role="listitem">
                <Link
                  to={row.rowPath}
                  className={cn(
                    "block rounded-[10px] bg-[rgba(1,10,4,0.04)] p-[14px] text-inherit no-underline transition-colors",
                    "hover:bg-[rgba(1,10,4,0.07)] active:bg-[rgba(1,10,4,0.09)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                  )}
                >
                  <div className="flex items-center gap-[15px]">
                    <span
                      className="h-[45px] w-[45px] shrink-0 rounded-[7px] bg-[#d9d9d9]"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-[6px]">
                        <span className="line-clamp-2 text-[16px] font-medium leading-[1.2] text-[#010a04]">
                          {row.name}
                        </span>
                        <span
                          role="img"
                          className={cn(
                            "mt-[6px] h-2 w-2 shrink-0 rounded-full",
                            row.statusDotClass
                          )}
                          aria-label={row.statusLabel}
                          title={row.statusLabel}
                        />
                      </div>
                      <div className="mt-[9px] flex items-center gap-[10px] text-[13px] text-[#010a04]/75 sm:text-[14px]">
                        <Calendar size={17} className="text-[#010a04]/60" />
                        <span>{row.dateText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-[14px] h-px w-full bg-[#010a04]/10" />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-6 w-6 shrink-0 rounded-full bg-[#d9d9d9]"
                        aria-hidden="true"
                      />
                      <span className="truncate text-[14px] text-[#010a04]">
                        {row.clubName}
                      </span>
                    </div>

                    <span className="flex shrink-0 items-center gap-2 text-[14px] text-[#010a04]">
                      {row.isDraft ? (
                        <PencilEdit01Icon size={16} className="text-[#010a04]" />
                      ) : (
                        <EyeIcon size={16} className="text-[#010a04]" />
                      )}
                      {row.isDraft ? t("tournaments.edit") : t("tournaments.view")}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden overflow-x-auto border-y border-black/10 lg:block">
        <Table className="min-w-[860px] table-fixed">
          <TableCaption className="sr-only">{listHeading}</TableCaption>
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
              const row = buildTournamentRowViewModel(tournament, t, language);
              const rowAriaLabel = t("tournaments.openTournamentRow", {
                name: row.name,
              });
              const desktopRowAriaLabel = row.statusLabel
                ? t("tournaments.openTournamentRowWithStatus", {
                    name: row.name,
                    status: row.statusLabel,
                  })
                : rowAriaLabel;
              const rowNumber =
                (pagination.page - 1) * pagination.limit + idx + 1;

              return (
                <TableRow
                  key={row.id}
                  className="border-0 hover:bg-transparent data-[state=selected]:bg-transparent"
                >
                  <TableCell
                    colSpan={4}
                    className="h-[45px] border-b border-black/10 bg-card p-0"
                  >
                    <Link
                      to={row.rowPath}
                      aria-label={desktopRowAriaLabel}
                      className={cn(
                        "grid min-h-[45px] w-full items-center text-inherit no-underline transition-colors",
                        "grid-cols-[3rem_minmax(0,21fr)_minmax(0,19fr)_minmax(0,10fr)]",
                        "hover:bg-black/[0.015] focus-visible:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-inset"
                      )}
                    >
                      <span className="flex h-full min-h-[45px] items-center px-4 text-xs text-foreground/90 tabular-nums">
                        {rowNumber}
                      </span>
                      <span className="flex h-full min-h-[45px] min-w-0 items-center gap-2 px-3">
                        <span
                          className="h-[22px] w-[22px] shrink-0 rounded-[5px] bg-black/15"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm text-foreground">
                          {row.name}
                        </span>
                        {row.statusLabel ? (
                          <span
                            role="img"
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              row.statusDotClass
                            )}
                            aria-label={row.statusLabel}
                          />
                        ) : (
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              row.statusDotClass
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="flex h-full min-h-[45px] min-w-0 items-center gap-2 px-3">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full bg-black/15"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm text-foreground">
                          {row.clubName}
                        </span>
                      </span>
                      <span className="flex h-full min-h-[45px] items-center px-3 text-sm text-foreground/90">
                        {row.dateText}
                      </span>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
